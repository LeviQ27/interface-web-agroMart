<template>
  <DefaultLayout>
    <div class="orders-page">
      <!-- Cabeçalho da página -->
      <div class="mb-4">
        <h1 class="text-h5 font-weight-bold mb-1">
          Meus Pedidos
        </h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Acompanhe os pedidos dos seus clientes
        </p>
      </div>

      <!-- Filtros -->
      <v-card
        class="mb-4"
        elevation="1"
      >
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="searchQuery"
                label="Buscar pedidos"
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
              md="4"
            >
              <v-select
                v-model="periodFilter"
                :items="periodOptions"
                label="Período"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Lista de pedidos -->
      <div v-if="loading">
        <v-row>
          <v-col
            v-for="n in 4"
            :key="n"
            cols="12"
          >
            <v-skeleton-loader
              type="list-item-three-line"
              class="mb-4"
            />
          </v-col>
        </v-row>
      </div>

      <div v-else-if="filteredOrders.length === 0">
        <EmptyState
          icon="mdi-clipboard-list-outline"
          title="Nenhum pedido encontrado"
          :description="searchQuery ? 'Tente buscar com outros termos' : 'Você ainda não recebeu pedidos'"
          :action-text="null"
        />
      </div>

      <div v-else>
        <v-card
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card mb-4"
          elevation="2"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <h3 class="text-h6 font-weight-bold">
                  Pedido #{{ order.id }}
                </h3>
                <p class="text-body-2 text-grey-darken-1 mb-0">
                  {{ formatDate(order.createdAt) }}
                </p>
              </div>
              
              <v-chip
                :color="getStatusColor(order.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusText(order.status) }}
              </v-chip>
            </div>

            <v-divider class="mb-3" />

            <!-- Informações de Entrega -->
            <div class="mb-3">
              <div class="d-flex align-center mb-2">
                <v-icon
                  size="small"
                  class="mr-2"
                  color="grey-darken-1"
                >
                  mdi-truck-delivery
                </v-icon>
                <span class="text-body-1 font-weight-medium">
                  Entrega: {{ getDeliveryTypeText(order.deliveryType) }}
                </span>
              </div>
              
              <div class="d-flex align-center">
                <v-icon
                  size="small"
                  class="mr-2"
                  color="grey-darken-1"
                >
                  mdi-calendar-clock
                </v-icon>
                <span class="text-body-2 text-grey-darken-1">
                  Previsão: {{ formatDate(order.deliveryPrediction) }}
                </span>
              </div>
            </div>

            <v-divider class="mb-3" />

            <!-- Informações do cliente -->
            <div class="mb-3">
              <div class="d-flex align-center mb-2">
                <v-icon
                  size="small"
                  class="mr-2"
                  color="grey-darken-1"
                >
                  mdi-account
                </v-icon>
                <span class="text-body-1 font-weight-medium">
                  {{ order.customer.name }}
                </span>
              </div>
              
              <div class="d-flex align-center mb-2">
                <v-icon
                  size="small"
                  class="mr-2"
                  color="grey-darken-1"
                >
                  mdi-phone
                </v-icon>
                <span class="text-body-2 text-grey-darken-1">
                  {{ order.customer.phone }}
                </span>
              </div>
              
              <div class="d-flex align-center">
                <v-icon
                  size="small"
                  class="mr-2"
                  color="grey-darken-1"
                >
                  mdi-map-marker
                </v-icon>
                <span class="text-body-2 text-grey-darken-1">
                  {{ order.customer.address }}
                </span>
              </div>
            </div>

            <v-divider class="mb-3" />

            <!-- Itens do pedido -->
            <div class="mb-3">
              <h4 class="text-subtitle-1 font-weight-bold mb-2">
                Itens do pedido:
              </h4>
              
              <div
                v-for="item in order.items"
                :key="item.id"
                class="d-flex align-center justify-space-between mb-2"
              >
                <div class="flex-grow-1">
                  <span class="text-body-1">{{ item.name }}</span>
                  <span class="text-body-2 text-grey-darken-1 ml-2">
                    x{{ item.quantity }}
                  </span>
                </div>
                
                <span class="text-body-1 font-weight-medium">
                  R$ {{ formatPrice(item.total) }}
                </span>
              </div>
            </div>

            <v-divider class="mb-3" />

            <!-- Total e ações -->
            <div class="d-flex align-center justify-space-between">
              <div>
                <span class="text-h6 font-weight-bold text-primary">
                  Total: R$ {{ formatPrice(order.total) }}
                </span>
              </div>
              
              <div class="d-flex gap-2">
                <v-btn
                  v-if="order.status === 'AGUARDANDO_PAGAMENTO'"
                  color="success"
                  variant="outlined"
                  size="small"
                  @click="updateOrderStatus(order.id, 'PAGO')"
                >
                  <v-icon class="mr-1">
                    mdi-check
                  </v-icon>
                  Confirmar
                </v-btn>
                
                <v-btn
                  v-if="order.status === 'PAGO'"
                  color="info"
                  variant="outlined"
                  size="small"
                  @click="updateOrderStatus(order.id, 'EM_PREPARO')"
                >
                  <v-icon class="mr-1">
                    mdi-package-variant
                  </v-icon>
                  Preparar
                </v-btn>
                
                <v-btn
                  v-if="order.status === 'EM_PREPARO'"
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="updateOrderStatus(order.id, 'PRONTO')"
                >
                  <v-icon class="mr-1">
                    mdi-truck
                  </v-icon>
                  Pronto
                </v-btn>
                
                <v-btn
                  color="grey"
                  variant="outlined"
                  size="small"
                  @click="viewOrderDetails(order)"
                >
                  <v-icon class="mr-1">
                    mdi-eye
                  </v-icon>
                  Detalhes
                </v-btn>

                <v-btn
                  color="error"
                  variant="outlined"
                  size="small"
                  @click="deleteOrder(order.id)"
                >
                  <v-icon class="mr-1">
                    mdi-delete
                  </v-icon>
                  Excluir
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import EmptyState from '../components/EmptyState.vue';
import { useAppStore } from '../store/app';
import { apiService } from '../services/api';

const getPayloadArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeOrder = (item) => {
  const attrs = item?.attributes || item || {};
  const loja = attrs.loja?.data?.attributes || attrs.loja || {};
  const cliente = attrs.cliente?.data?.attributes || attrs.cliente || attrs.user || {};
  const itens = Array.isArray(attrs.itens) ? attrs.itens : [];

  return {
    id: item?.id || attrs.id,
    codigo: attrs.codigo || `Pedido #${item?.id || attrs.id}`,
    createdAt: attrs.createdAt || attrs.created_at,
    status: attrs.status || 'AGUARDANDO_PAGAMENTO',
    deliveryType: attrs.tipo_entrega || attrs.tipo_de_entrega || 'Receber',
    deliveryPrediction: attrs.updatedAt || attrs.createdAt,
    customer: {
      name: cliente.username || cliente.nome || cliente.email || 'Cliente não informado',
      phone: cliente.telefone || cliente.phone || 'Não informado',
      address: 'Endereço cadastrado no cliente',
    },
    loja,
    items: itens.map((item, index) => ({
      id: item.id || index,
      name: item.nome || item.name || 'Item',
      quantity: item.quantidade || item.quantity || 1,
      total: Number(item.valor_total || (item.valor_unitario || item.valor || item.value || 0) * (item.quantidade || item.quantity || 1)),
    })),
    total: Number(attrs.valor_total || attrs.valor || 0),
  };
};

export default {
  name: 'OrdersPage',
  components: { DefaultLayout, EmptyState },
  setup() {
    const appStore = useAppStore();
    const loading = ref(false);
    const searchQuery = ref('');
    const statusFilter = ref('all');
    const periodFilter = ref('all');
    const orders = ref([]);

    const statusOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Aguardando pagamento', value: 'AGUARDANDO_PAGAMENTO' },
      { title: 'Pago', value: 'PAGO' },
      { title: 'Em preparo', value: 'EM_PREPARO' },
      { title: 'Pronto', value: 'PRONTO' },
      { title: 'Entregue', value: 'ENTREGUE' },
      { title: 'Cancelado', value: 'CANCELADO' },
    ];
    const periodOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Hoje', value: 'today' },
      { title: 'Esta semana', value: 'week' },
      { title: 'Este mês', value: 'month' },
    ];

    const fetchOrders = async () => {
      loading.value = true;
      try {
        const response = await apiService.getOrders();
        orders.value = getPayloadArray(response.data).map(normalizeOrder);
      } catch (error) {
        appStore.showSnackbar('Erro ao carregar pedidos da API', 'error');
      } finally {
        loading.value = false;
      }
    };

    const filteredOrders = computed(() => {
      let filtered = [...orders.value];
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(order => String(order.id).includes(query) || String(order.codigo).toLowerCase().includes(query) || order.customer.name.toLowerCase().includes(query));
      }
      if (statusFilter.value !== 'all') filtered = filtered.filter(order => order.status === statusFilter.value);
      if (periodFilter.value !== 'all') {
        const now = new Date();
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          if (periodFilter.value === 'today') return orderDate.toDateString() === now.toDateString();
          if (periodFilter.value === 'week') return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (periodFilter.value === 'month') return orderDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return true;
        });
      }
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return filtered;
    });

    const getDeliveryTypeText = (type) => type === 'Buscar' ? 'Cliente retira' : 'Receber/entrega';
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Não informado';
    const formatPrice = (price) => Number(price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const getStatusColor = (status) => ({ AGUARDANDO_PAGAMENTO: 'warning', PAGO: 'success', EM_PREPARO: 'primary', PRONTO: 'info', ENTREGUE: 'success', CANCELADO: 'error' }[status] || 'grey');
    const getStatusText = (status) => ({ AGUARDANDO_PAGAMENTO: 'Aguardando pagamento', PAGO: 'Pago', EM_PREPARO: 'Em preparo', PRONTO: 'Pronto', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' }[status] || status);

    const updateOrderStatus = async (orderId, newStatus) => {
      try {
        await apiService.updateOrderStatus(orderId, newStatus);
        await fetchOrders();
        appStore.showSnackbar(`Pedido #${orderId} atualizado para ${getStatusText(newStatus)}`, 'success');
      } catch (error) {
        appStore.showSnackbar('Erro ao atualizar pedido', 'error');
      }
    };

    const viewOrderDetails = (order) => {
      appStore.showSnackbar(`${order.codigo}: ${order.items.length} item(ns), total R$ ${formatPrice(order.total)}`, 'info');
    };

    const deleteOrder = async (orderId) => {
      if (!window.confirm(`Excluir o pedido #${orderId}? Essa ação também remove a cobrança Pix vinculada.`)) return;
      try {
        await apiService.deleteOrder(orderId);
        await fetchOrders();
        appStore.showSnackbar(`Pedido #${orderId} excluído com sucesso`, 'success');
      } catch (error) {
        appStore.showSnackbar(error.response?.data?.error?.message || 'Erro ao excluir pedido', 'error');
      }
    };

    onMounted(fetchOrders);
    return { loading, searchQuery, statusFilter, periodFilter, statusOptions, periodOptions, filteredOrders, formatDate, formatPrice, getStatusColor, getStatusText, getDeliveryTypeText, updateOrderStatus, viewOrderDetails, deleteOrder };
  },
};
</script>

<style scoped>
.orders-page {
  max-width: 1200px;
  margin: 0 auto;
}

.order-card {
  transition: transform 0.2s ease;
}

.order-card:hover {
  transform: translateY(-1px);
}

/* Responsividade */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .d-flex.gap-2 {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>

