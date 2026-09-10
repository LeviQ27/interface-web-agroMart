<template>
  <DefaultLayout>
    <div class="payments-page">
      <div class="mb-4">
        <h1 class="text-h5 font-weight-bold mb-1">
          Pagamentos Pix
        </h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Gere cobranças vinculadas aos pedidos/extratos do AgroMart, acompanhe comprovantes e valide pagamentos.
        </p>
      </div>

      <v-alert
        v-if="paymentStore.error"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        {{ paymentStore.error }}
      </v-alert>

      <v-row class="mb-4">
        <v-col
          cols="12"
          md="3"
        >
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption text-grey-darken-1">
                Pendentes
              </div>
              <div class="text-h5 font-weight-bold">
                {{ summary.pending }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption text-grey-darken-1">
                Com comprovante
              </div>
              <div class="text-h5 font-weight-bold">
                {{ summary.receipts }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption text-grey-darken-1">
                Aprovados
              </div>
              <div class="text-h5 font-weight-bold">
                {{ summary.approved }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption text-grey-darken-1">
                Rejeitados
              </div>
              <div class="text-h5 font-weight-bold">
                {{ summary.rejected }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card
        class="mb-4"
        elevation="1"
      >
        <v-card-title>Nova cobrança Pix</v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              cols="12"
              md="5"
            >
              <v-select
                v-model="selectedOrderId"
                :items="orderOptions"
                :loading="paymentStore.ordersLoading"
                label="Pedido/Extrato existente"
                variant="outlined"
                density="comfortable"
                clearable
                item-title="title"
                item-value="value"
                @update:model-value="fillFromOrder"
              />
            </v-col>
            <v-col
              cols="12"
              md="3"
            >
              <v-text-field
                v-model="form.referencia_pedido"
                label="Referência do pedido"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col
              cols="12"
              md="2"
            >
              <v-text-field
                v-model.number="form.valor"
                label="Valor"
                prefix="R$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col
              cols="12"
              md="2"
            >
              <v-btn
                block
                variant="outlined"
                :loading="paymentStore.ordersLoading"
                @click="paymentStore.fetchOrders()"
              >
                <v-icon class="mr-1">
                  mdi-refresh
                </v-icon>
                Pedidos
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="form.chave_pix"
                label="Chave Pix da CSA"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="form.nome_recebedor"
                label="Recebedor"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="form.cidade_recebedor"
                label="Cidade"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-btn
            color="primary"
            :loading="paymentStore.loading"
            @click="generatePayment"
          >
            <v-icon class="mr-1">
              mdi-qrcode
            </v-icon>
            Gerar Pix
          </v-btn>
          <v-btn
            variant="text"
            @click="resetForm"
          >
            Limpar
          </v-btn>
        </v-card-actions>
      </v-card>

      <v-card
        class="mb-4"
        elevation="1"
      >
        <v-card-text>
          <v-row align="center">
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="search"
                label="Buscar por pedido, TXID, recebedor ou status"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <v-select
                v-model="statusFilter"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              md="2"
            >
              <v-btn
                block
                variant="outlined"
                :loading="paymentStore.loading"
                @click="reload"
              >
                <v-icon class="mr-1">
                  mdi-refresh
                </v-icon>
                Atualizar
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div v-if="paymentStore.loading">
        <v-skeleton-loader
          v-for="n in 3"
          :key="n"
          type="card"
          class="mb-4"
        />
      </div>

      <EmptyState
        v-else-if="filteredPayments.length === 0"
        icon="mdi-cash-clock"
        title="Nenhum pagamento encontrado"
        description="Confira se a API está rodando em http://localhost:1337 e gere uma cobrança Pix vinculada a um pedido."
        :action-text="null"
      />

      <v-card
        v-for="payment in filteredPayments"
        :key="payment.id"
        class="mb-4"
        elevation="2"
      >
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <h3 class="text-h6 font-weight-bold">
                {{ payment.referencia_pedido || `Pagamento #${payment.id}` }}
              </h3>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                TXID: {{ payment.txid || 'Não informado' }}
              </p>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                ID API: {{ payment.id }}
              </p>
            </div>
            <div class="d-flex align-center gap-2">
              <v-chip
                v-if="isPaymentFinal(payment)"
                size="small"
                color="grey"
                variant="tonal"
              >
                Decisão final
              </v-chip>
              <v-chip
                :color="statusColor(payment.status)"
                variant="tonal"
              >
                {{ statusText(payment.status) }}
              </v-chip>
            </div>
          </div>

          <v-row>
            <v-col
              cols="12"
              md="8"
            >
              <div class="text-subtitle-1 font-weight-bold mb-1">
                R$ {{ formatPrice(payment.valor) }}
              </div>
              <div class="text-body-2 text-grey-darken-1 mb-2">
                Recebedor: {{ payment.nome_recebedor || '-' }} • Chave: {{ payment.chave_pix || '-' }}
              </div>
              <div class="text-body-2 text-grey-darken-1 mb-2">
                Pedido/Extrato vinculado: {{ relatedOrderLabel(payment) }}
              </div>
              <div class="text-body-2 text-grey-darken-1 mb-2">
                Comprovante: {{ receiptLabel(payment) }}
              </div>
              <v-textarea
                :model-value="payment.pix_copia_cola || ''"
                label="Pix Copia e Cola"
                readonly
                variant="outlined"
                auto-grow
                rows="2"
              />
            </v-col>
            <v-col
              cols="12"
              md="4"
              class="text-center"
            >
              <v-img
                v-if="qrSrc(payment)"
                :src="qrSrc(payment)"
                alt="QR Code Pix"
                max-width="180"
                class="mx-auto mb-2"
              />
              <v-icon
                v-else
                size="96"
                color="grey-lighten-1"
              >
                mdi-qrcode
              </v-icon>
              <v-btn
                size="small"
                variant="outlined"
                :disabled="!payment.pix_copia_cola"
                @click="copyPix(payment.pix_copia_cola)"
              >
                <v-icon class="mr-1">
                  mdi-content-copy
                </v-icon>
                Copiar Pix
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <div class="d-flex flex-wrap gap-2">
            <v-btn
              color="success"
              variant="outlined"
              size="small"
              :loading="actionLoading === `approve-${payment.id}`"
              :disabled="isPaymentFinal(payment)"
              @click="approve(payment.id)"
            >
              <v-icon class="mr-1">
                mdi-check-circle
              </v-icon>
              Aprovar
            </v-btn>
            <v-btn
              color="error"
              variant="outlined"
              size="small"
              :loading="actionLoading === `reject-${payment.id}`"
              :disabled="isPaymentFinal(payment)"
              @click="reject(payment.id)"
            >
              <v-icon class="mr-1">
                mdi-close-circle
              </v-icon>
              Rejeitar
            </v-btn>
            <v-btn
              color="info"
              variant="outlined"
              size="small"
              :disabled="!hasReceipt(payment)"
              @click="downloadReceipt(payment)"
            >
              <v-icon class="mr-1">
                mdi-download
              </v-icon>
              Baixar comprovante
            </v-btn>
            <v-btn
              color="grey-darken-1"
              variant="outlined"
              size="small"
              :loading="actionLoading === `delete-${payment.id}`"
              @click="deletePayment(payment.id)"
            >
              <v-icon class="mr-1">
                mdi-delete
              </v-icon>
              Apagar
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </DefaultLayout>
</template>

<script>
import { computed, onMounted, reactive, ref } from 'vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import EmptyState from '../components/EmptyState.vue';
import { useAppStore } from '../store/app';
import { usePaymentStore } from '../store/payments';

export default {
  name: 'PaymentsPage',
  components: { DefaultLayout, EmptyState },
  setup() {
    const appStore = useAppStore();
    const paymentStore = usePaymentStore();
    const search = ref('');
    const statusFilter = ref('TODOS');
    const selectedOrderId = ref(null);
    const actionLoading = ref(null);

    const form = reactive({
      extrato: null,
      referencia_pedido: '',
      valor: 0,
      chave_pix: '',
      nome_recebedor: 'CSA AGROMART',
      cidade_recebedor: 'BRASILIA',
      loja: null,
      consumidor: null,
    });


    const statusOptions = [
      { title: 'Todos', value: 'TODOS' },
      { title: 'Pendente', value: 'PENDENTE' },
      { title: 'Com comprovante', value: 'COMPROVANTE_ENVIADO' },
      { title: 'Aprovado', value: 'APROVADO' },
      { title: 'Rejeitado', value: 'REJEITADO' },
      { title: 'Expirado', value: 'EXPIRADO' },
    ];

    const orderOptions = computed(() => paymentStore.orders.map(order => ({
      title: order.label,
      value: order.id,
    })));

    const summary = computed(() => ({
      pending: paymentStore.payments.filter(item => item.status === 'PENDENTE').length,
      receipts: paymentStore.payments.filter(item => item.status === 'COMPROVANTE_ENVIADO').length,
      approved: paymentStore.payments.filter(item => item.status === 'APROVADO').length,
      rejected: paymentStore.payments.filter(item => item.status === 'REJEITADO').length,
    }));

    const filteredPayments = computed(() => {
      const term = search.value?.toLowerCase() || '';
      return paymentStore.payments.filter((payment) => {
        const matchesStatus = statusFilter.value === 'TODOS' || payment.status === statusFilter.value;
        const matchesSearch = !term || [
          payment.referencia_pedido,
          payment.txid,
          payment.nome_recebedor,
          payment.status,
          payment.id,
        ].some(value => String(value || '').toLowerCase().includes(term));
        return matchesStatus && matchesSearch;
      });
    });

    const isPaymentFinal = (payment) => ['APROVADO', 'REJEITADO'].includes(payment?.status);

    const fillFromOrder = () => {
      const order = paymentStore.orders.find(item => String(item.id) === String(selectedOrderId.value));
      if (!order) {
        form.extrato = null;
        return;
      }
      form.extrato = order.id;
      form.referencia_pedido = `Pedido #${order.id}`;
      form.valor = Number(order.total || 0);
      form.loja = order.loja?.id || null;
      form.consumidor = order.user?.id || null;
    };

    const generatePayment = async () => {
      if (!form.referencia_pedido || !form.valor || !form.chave_pix || !form.nome_recebedor) {
        appStore.showSnackbar('Preencha pedido, valor, chave Pix e recebedor.', 'warning');
        return;
      }

      try {
        await paymentStore.generatePixPayment({ ...form });
        appStore.showSnackbar('Cobrança Pix gerada com sucesso.', 'success');
        resetForm();
      } catch (error) {
        appStore.showSnackbar(error.response?.data?.error?.message || 'Erro ao gerar cobrança Pix.', 'error');
      }
    };

    const resetForm = () => {
      selectedOrderId.value = null;
      form.extrato = null;
      form.referencia_pedido = '';
      form.valor = 0;
      form.chave_pix = '';
      form.nome_recebedor = 'CSA AGROMART';
      form.cidade_recebedor = 'BRASILIA';
      form.loja = null;
      form.consumidor = null;
    };

    const withAction = async (key, callback, successMessage) => {
      actionLoading.value = key;
      try {
        await callback();
        appStore.showSnackbar(successMessage, 'success');
      } catch (error) {
        appStore.showSnackbar(error.response?.data?.error?.message || error.message || 'Erro ao executar ação no pagamento.', 'error');
      } finally {
        actionLoading.value = null;
      }
    };

    const approve = (id) => withAction(`approve-${id}`, async () => {
      await paymentStore.approvePayment(id, 'Aprovado pela interface web');
      await paymentStore.fetchPayments();
    }, 'Pagamento aprovado definitivamente.');
    const reject = (id) => withAction(`reject-${id}`, async () => {
      await paymentStore.rejectPayment(id, 'Comprovante inválido ou divergente');
      await paymentStore.fetchPayments();
    }, 'Pagamento rejeitado definitivamente.');
    const STRAPI_ROOT_URL = (process.env.VUE_APP_STRAPI_API_URL || 'http://localhost:1337/api').replace(/\/api\/?$/, '');

    const resolveReceiptUrl = (payment) => {
      const file = payment?.comprovante;
      if (!file) return '';

      const url = file.url
        || file.previewUrl
        || file.formats?.large?.url
        || file.formats?.medium?.url
        || file.formats?.small?.url
        || file.formats?.thumbnail?.url
        || '';

      if (!url) return '';
      if (/^https?:\/\//i.test(url)) return url;
      return `${STRAPI_ROOT_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    const hasReceipt = (payment) => Boolean(resolveReceiptUrl(payment));

    const downloadReceipt = (payment) => {
      const url = resolveReceiptUrl(payment);
      if (!url) {
        appStore.showSnackbar('Este pagamento ainda não possui comprovante disponível para download.', 'warning');
        return;
      }

      const file = payment.comprovante || {};
      const filename = file.name || file.filename || `comprovante-pagamento-${payment.id}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const deletePayment = (id) => withAction(`delete-${id}`, () => paymentStore.deletePayment(id), 'Pagamento apagado.');

    const copyPix = async (value) => {
      if (!value) return;
      await navigator.clipboard.writeText(value);
      appStore.showSnackbar('Código Pix copiado.', 'success');
    };

    const reload = async () => {
      await Promise.all([paymentStore.fetchPayments(), paymentStore.fetchOrders()]);
    };

    const qrSrc = (payment) => {
      if (payment.qr_code_url) return payment.qr_code_url;
      if (!payment.pix_copia_cola) return '';
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payment.pix_copia_cola)}`;
    };

    const relatedOrderLabel = (payment) => {
      const orderId = payment.extrato?.id || payment.extrato;
      if (orderId) return `Pedido/Extrato #${orderId}`;
      return payment.referencia_pedido || 'Não vinculado';
    };

    const receiptLabel = (payment) => {
      if (!payment.comprovante) return 'Não enviado';
      return payment.comprovante.name || payment.comprovante.filename || payment.comprovante.alternativeText || `Arquivo #${payment.comprovante.id || '-'}`;
    };

    const formatPrice = (price) => Number(price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const statusText = (status) => ({
      PENDENTE: 'Pendente',
      COMPROVANTE_ENVIADO: 'Com comprovante',
      APROVADO: 'Aprovado',
      REJEITADO: 'Rejeitado',
      EXPIRADO: 'Expirado',
    }[status] || status || 'Pendente');

    const statusColor = (status) => ({
      PENDENTE: 'warning',
      COMPROVANTE_ENVIADO: 'info',
      APROVADO: 'success',
      REJEITADO: 'error',
      EXPIRADO: 'grey',
    }[status] || 'grey');

    onMounted(reload);

    return {
      paymentStore,
      form,
      search,
      statusFilter,
      statusOptions,
      selectedOrderId,
      orderOptions,
      actionLoading,
      summary,
      filteredPayments,
      isPaymentFinal,
      hasReceipt,
      downloadReceipt,
      fillFromOrder,
      generatePayment,
      resetForm,
      approve,
      reject,
      deletePayment,
      copyPix,
      reload,
      qrSrc,
      relatedOrderLabel,
      receiptLabel,
      formatPrice,
      statusText,
      statusColor,
    };
  },
};
</script>

<style scoped>
.payments-page {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 88px;
}

.gap-2 {
  gap: 8px;
}
</style>
