import { defineStore } from 'pinia';
import { apiService } from '../services/api';

const FINAL_STATUSES = ['APROVADO', 'REJEITADO'];

const unwrap = (item) => {
  const attrs = item?.attributes || item || {};
  return { id: item?.id || attrs.id, ...attrs };
};

const extractList = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.pagamentos)) return payload.pagamentos;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  if (payload && typeof payload === 'object' && payload.id) return [payload];
  return [];
};

const extractOne = (response) => response?.data?.data || response?.data || null;

const normalizeStatus = (status) => String(status || 'PENDENTE').toUpperCase();

const normalizeRelation = (relation) => {
  if (!relation) return null;
  if (Array.isArray(relation?.data)) return relation.data.map(unwrap);
  if (relation.data) return unwrap(relation.data);
  return unwrap(relation);
};

const normalizeMedia = (media) => {
  if (!media) return null;
  if (Array.isArray(media?.data)) return media.data.map(unwrap)[0] || null;
  if (media.data) return unwrap(media.data);
  if (Array.isArray(media)) return media.map(unwrap)[0] || null;
  return unwrap(media);
};

const normalizePayment = (item) => {
  const payment = unwrap(item);
  return {
    ...payment,
    status: normalizeStatus(payment.status),
    pix_copia_cola: payment.pix_copia_cola || payment.pixPayload || payment.pix_payload || payment.payload_pix || '',
    qr_code_url: payment.qr_code_url || payment.qrCodeUrl || payment.qrcode_url || '',
    chave_pix: payment.chave_pix || payment.pix_chave || payment.chavePix || '',
    nome_recebedor: payment.nome_recebedor || payment.recebedor || payment.nomeRecebedor || '',
    referencia_pedido: payment.referencia_pedido || payment.referencia || payment.pedido_referencia || '',
    extrato: normalizeRelation(payment.extrato || payment.pedido),
    loja: normalizeRelation(payment.loja),
    consumidor: normalizeRelation(payment.consumidor || payment.user || payment.usuario),
    comprovante: normalizeMedia(payment.comprovante || payment.receipt || payment.arquivo_comprovante),
  };
};

const normalizeOrder = (item) => {
  const order = unwrap(item);
  const user = normalizeRelation(order.user || order.usuario || order.consumidor);
  const loja = normalizeRelation(order.loja);
  const itensRaw = order.itens?.data || order.itens || [];
  const itens = Array.isArray(itensRaw) ? itensRaw.map(unwrap) : [];
  const total = Number(order.valor || order.total || itens.reduce((sum, item) => sum + Number(item.valor || 0) * Number(item.quantidade || 1), 0));

  return {
    ...order,
    id: order.id,
    user,
    loja,
    itens,
    total,
    label: `Pedido/Extrato #${order.id} - R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };
};

export const usePaymentStore = defineStore('payments', {
  state: () => ({
    payments: [],
    orders: [],
    loading: false,
    ordersLoading: false,
    error: null,
  }),

  getters: {
    pendingPayments: (state) => state.payments.filter(payment => ['PENDENTE', 'COMPROVANTE_ENVIADO'].includes(payment.status)),
    approvedPayments: (state) => state.payments.filter(payment => payment.status === 'APROVADO'),
  },

  actions: {
    async fetchPayments() {
      this.loading = true;
      this.error = null;
      try {
        const [response, legacyResponse] = await Promise.all([
          apiService.getPayments(),
          apiService.getLegacyPayments ? apiService.getLegacyPayments() : Promise.resolve({ data: [] }),
        ]);

        const apiPayments = extractList(response).map(normalizePayment);
        const legacyPayments = extractList(legacyResponse)
          .map(normalizePayment)
          .filter(payment => payment.id && !apiPayments.some(item => String(item.id) === String(payment.id)));

        this.payments = [...apiPayments, ...legacyPayments];
        this.persistFallback();
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Não foi possível carregar pagamentos da API.';
        const localPayments = JSON.parse(localStorage.getItem('agromart_pagamentos') || '[]');
        this.payments = localPayments.map(normalizePayment);
      } finally {
        this.loading = false;
      }
    },

    async fetchOrders() {
      this.ordersLoading = true;
      try {
        const response = await apiService.getOrders();
        const data = extractList(response);
        this.orders = data.map(normalizeOrder);
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message;
        this.orders = [];
      } finally {
        this.ordersLoading = false;
      }
    },

    async generatePixPayment(payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiService.generatePixPayment(payload);
        const payment = normalizePayment(extractOne(response));
        this.payments = [payment, ...this.payments.filter(item => String(item.id) !== String(payment.id))];
        this.persistFallback();
        return payment;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async approvePayment(id, observacao = '') {
      const current = this.payments.find(payment => String(payment.id) === String(id));
      if (FINAL_STATUSES.includes(current?.status)) throw new Error('Pagamento já finalizado. A decisão não pode ser alterada pela interface.');
      const response = await apiService.approvePayment(id, observacao);
      const updated = normalizePayment(extractOne(response));
      this.updateLocal(updated || { id, status: 'APROVADO' });
      return updated;
    },

    async rejectPayment(id, motivo = '') {
      const current = this.payments.find(payment => String(payment.id) === String(id));
      if (FINAL_STATUSES.includes(current?.status)) throw new Error('Pagamento já finalizado. A decisão não pode ser alterada pela interface.');
      const response = await apiService.rejectPayment(id, motivo);
      const updated = normalizePayment(extractOne(response));
      this.updateLocal(updated || { id, status: 'REJEITADO', motivo_rejeicao: motivo });
      return updated;
    },

    async sendReceipt(id, payload) {
      const current = this.payments.find(payment => String(payment.id) === String(id));
      if (FINAL_STATUSES.includes(current?.status)) throw new Error('Pagamento já finalizado. Não é possível registrar comprovante depois da aprovação/rejeição.');
      const response = await apiService.sendPaymentReceipt(id, payload);
      const updated = normalizePayment(extractOne(response));
      this.updateLocal(updated || { id, status: 'COMPROVANTE_ENVIADO' });
      return updated;
    },

    async deletePayment(id) {
      await apiService.deletePayment(id);
      this.payments = this.payments.filter(payment => String(payment.id) !== String(id));
      this.persistFallback();
    },

    updateLocal(updated) {
      this.payments = this.payments.map(payment => String(payment.id) === String(updated.id) ? { ...payment, ...updated } : payment);
      this.persistFallback();
    },

    persistFallback() {
      localStorage.setItem('agromart_pagamentos', JSON.stringify(this.payments));
    },
  },
});
