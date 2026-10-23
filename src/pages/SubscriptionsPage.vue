<template>
  <DefaultLayout>
    <v-container>
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
        <h1 class="text-h5">
          Planos de cestas e assinaturas
        </h1><v-btn
          color="primary"
          prepend-icon="mdi-plus"
          :disabled="!lojaId"
          @click="createDialog = true"
        >
          Criar novo plano
        </v-btn>
      </div>
      <p>Cadastre planos semanais ou mensais vinculados às cestas da sua loja. O cliente assina pelo aplicativo.</p>
      <v-alert
        v-if="error"
        type="error"
        class="mb-3"
      >
        {{ error }}
      </v-alert>
      <v-select
        v-model="lojaId"
        :items="lojas"
        item-title="nome"
        item-value="id"
        label="Loja"
        @update:model-value="load"
      />
      <v-dialog
        v-model="createDialog"
        max-width="650"
      >
        <v-card class="pa-4 mb-4">
          <h2 class="text-h6 mb-3">
            Novo plano
          </h2>
          <v-text-field
            v-model="form.nome"
            label="Nome do plano"
          />
          <v-textarea
            v-model="form.descricao"
            label="Descrição"
            rows="2"
          />
          <v-select
            v-model="form.periodicidade"
            label="Frequência da cobrança"
            :items="[{title:'Semanal',value:'SEMANAL'},{title:'Mensal',value:'MENSAL'}]"
          />
          <v-select
            v-model="form.cestas"
            :items="cestas"
            item-title="nome"
            item-value="id"
            multiple
            chips
            label="Cestas incluídas"
          />
          <v-text-field
            v-model.number="form.desconto_percentual"
            type="number"
            min="0"
            max="100"
            label="Desconto sobre as cestas incluídas (%)"
          />
          <v-text-field
            :model-value="money(calculate(form).final)"
            label="Preço por ciclo (R$)"
            readonly
            hint="Calculado automaticamente a partir das cestas e do desconto"
            persistent-hint
          />
          <v-btn
            variant="text"
            class="mr-2"
            @click="createDialog = false"
          >
            Cancelar
          </v-btn><v-btn
            color="primary"
            :loading="saving"
            :disabled="!lojaId"
            @click="save"
          >
            Criar e publicar plano
          </v-btn>
        </v-card>
      </v-dialog>
      <h2 class="text-h6">
        Planos cadastrados
      </h2>
      <v-list>
        <v-list-item
          v-for="p in planos"
          :key="p.id"
          :title="p.nome"
          :subtitle="`${p.periodicidade} — R$ ${p.valor} / ciclo`"
        >
          <template #append>
            <v-btn
              size="small"
              prepend-icon="mdi-pencil"
              @click="edit(p)"
            >
              Editar
            </v-btn><v-btn
              class="ml-2"
              size="small"
              color="error"
              prepend-icon="mdi-delete"
              @click="askDelete(p)"
            >
              Excluir
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
      <h2 class="text-h6 mt-4">
        Assinaturas dos clientes
      </h2>
      <v-table>
        <thead><tr><th>Cliente</th><th>Plano</th><th>Frequência</th><th>Próxima cobrança</th><th>Status</th><th>Renovação</th></tr></thead><tbody>
          <tr
            v-for="a in assinaturas"
            :key="a.id"
          >
            <td>{{ a.cliente?.username || a.cliente?.email || a.cliente?.id }}</td><td>{{ a.plano?.nome }}</td><td>{{ a.periodicidade }}</td><td>{{ formatDate(a.proxima_cobranca) }}</td><td>{{ a.status }}</td><td>Automática</td>
          </tr>
        </tbody>
      </v-table>
      <v-alert
        type="info"
        class="mt-4"
      >
        Renovações são verificadas automaticamente a cada 15 minutos pela API enquanto o servidor estiver ativo. A assinatura é cancelada se a cobrança permanecer sem aprovação por 3 dias. A confirmação bancária Pix ainda é manual.
      </v-alert>
      <v-dialog
        v-model="editDialog"
        max-width="650"
      >
        <v-card class="pa-4">
          <v-card-title>Editar plano</v-card-title><v-card-text>
            <v-text-field
              v-model="editForm.nome"
              label="Nome do plano"
            />
            <v-textarea
              v-model="editForm.descricao"
              label="Descrição"
              rows="2"
            />
            <v-select
              v-model="editForm.periodicidade"
              label="Frequência"
              :items="[{title:'Semanal',value:'SEMANAL'},{title:'Mensal',value:'MENSAL'}]"
            />
            <v-select
              v-model="editForm.cestas"
              :items="cestas"
              item-title="nome"
              item-value="id"
              multiple
              chips
              label="Cestas incluídas"
            />
            <v-text-field
              v-model.number="editForm.desconto_percentual"
              type="number"
              min="0"
              max="100"
              label="Desconto sobre as cestas incluídas (%)"
            />
            <v-text-field
              :model-value="money(calculate(editForm).final)"
              label="Preço por ciclo (R$)"
              readonly
              hint="Calculado automaticamente a partir das cestas e do desconto"
              persistent-hint
            />
          </v-card-text><v-card-actions>
            <v-spacer /><v-btn @click="editDialog = false">
              Cancelar
            </v-btn><v-btn
              color="primary"
              :loading="saving"
              @click="saveEdit"
            >
              Salvar alterações
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="deleteDialog"
        max-width="430"
      >
        <v-card>
          <v-card-title>Excluir plano?</v-card-title><v-card-text>Excluir "{{ planToDelete?.nome }}"? Planos com assinaturas associadas não podem ser excluídos.</v-card-text><v-card-actions>
            <v-spacer /><v-btn @click="deleteDialog = false">
              Cancelar
            </v-btn><v-btn
              color="error"
              :loading="saving"
              @click="deletePlan"
            >
              Excluir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>
<script>
import { ref, onMounted, onUnmounted } from 'vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import { apiService } from '../services/api';

const unwrap = response => response.data?.data || response.data || [];
const normalize = list => (Array.isArray(list) ? list : []).map(x => ({
  id: x.id,
  ...(x.attributes || x),
}));

export default {
  components: { DefaultLayout },
  setup() {
    const lojas = ref([]);
    const lojaId = ref(null);
    const cestas = ref([]);
    const produtos = ref([]);
    const planos = ref([]);
    const assinaturas = ref([]);
    const error = ref('');
    const saving = ref(false);
    const editing = ref(null);
    const editDialog = ref(false);
    const createDialog = ref(false);
    const deleteDialog = ref(false);
    const editForm = ref({});
    const planToDelete = ref(null);
    const empty = () => ({
      nome: '', descricao: '', periodicidade: 'SEMANAL', valor: 0, cestas: [], desconto_percentual: 0,
    });
    const form = ref(empty());

    const reset = () => {
      editing.value = null;
      form.value = empty();
    };

    const load = async () => {
      if (!lojaId.value) return;
      try {
        const [b, p, a, productsResponse] = await Promise.all([
          apiService.getBaskets(),
          apiService.getPlans(),
          apiService.getStoreSubscriptions(lojaId.value),
          apiService.getProducts(),
        ]);
        produtos.value = normalize(unwrap(productsResponse)).filter(x => Number(x.loja?.id || x.loja?.data?.id || x.loja) === Number(lojaId.value));
        cestas.value = normalize(unwrap(b)).filter(x => Number(
          x.loja?.id || x.loja?.data?.id || x.loja,
        ) === Number(lojaId.value));
        planos.value = normalize(unwrap(p)).filter(x => {
          const ls = x.lojas?.data || x.lojas || [];
          return ls.some(l => Number(l.id) === Number(lojaId.value));
        });
        assinaturas.value = normalize(unwrap(a));
      } catch (e) {
        error.value = e.response?.data?.error?.message || e.message;
      }
    };

    const calculate = state => {
      const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
      const original = (state.cestas || []).reduce((sum, id) => {
        const basket = cestas.value.find(b => Number(b.id) === Number(id));
        if (!basket) return sum;
        // Uma cesta com composição utiliza o preço atual dos produtos, não um valor manual do plano.
        if (Array.isArray(basket.composicao) && basket.composicao.length) {
          return sum + basket.composicao.reduce((subtotal, item) => {
            const product = produtos.value.find(p => Number(p.id) === Number(item.produtoId));
            return subtotal + Number(product?.valor || 0) * Number(item.quantidade || 0);
          }, 0);
        }
        return sum + Number(basket.valor || 0);
      }, 0);
      const discount = Math.min(100, Math.max(0, Number(state.desconto_percentual || 0)));
      return { original: round(original), economia: round(original * discount / 100), final: round(original * (1 - discount / 100)) };
    };
    const money = n => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const save = async () => {
      saving.value = true;
      error.value = '';
      try {
        const data = { ...form.value, lojaId: lojaId.value };
        data.valor = calculate(data).final;
        if (!data.cestas.length || data.valor <= 0) throw new Error('Selecione cestas com valor total positivo.');
        await apiService.createSubscriptionPlan(data);
        reset();
        createDialog.value = false;
        await load();
      } catch (e) {
        error.value = e.response?.data?.error?.message || e.message;
      } finally {
        saving.value = false;
      }
    };

    const edit = p => {
      editing.value = p.id;
      editDialog.value = true;
      editForm.value = {
        nome: p.nome,
        descricao: p.descricao || '',
        periodicidade: p.periodicidade || 'SEMANAL',
        valor: Number(p.valor),
        cestas: (p.cestas?.data || p.cestas || []).map(c => c.id),

        desconto_percentual: Number(p.desconto_percentual || 0),
      };
    };

    const saveEdit = async () => {
      saving.value = true;
      error.value = '';
      try {
        const data = { ...editForm.value, lojaId: lojaId.value };
        data.valor = calculate(data).final;
        if (!data.cestas.length || data.valor <= 0) throw new Error('Selecione cestas com valor total positivo.');
        await apiService.updateSubscriptionPlan(editing.value, data);
        editDialog.value = false;
        reset();
        await load();
      } catch (e) { error.value = e.response?.data?.error?.message || e.message; }
      finally { saving.value = false; }
    };
    const askDelete = p => { planToDelete.value = p; deleteDialog.value = true; };
    const deletePlan = async () => {
      if (!planToDelete.value) return;
      saving.value = true;
      error.value = '';
      try {
        await apiService.deleteSubscriptionPlan(planToDelete.value.id, lojaId.value);
        deleteDialog.value = false;
        await load();
      } catch (e) { error.value = e.response?.data?.error?.message || e.message; }
      finally { saving.value = false; }
    };
    const renew = async id => {
      try {
        await apiService.renewSubscription(id);
        await load();
      } catch (e) {
        error.value = e.response?.data?.error?.message || e.message;
      }
    };

    let refreshTimer;
    onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });
    onMounted(async () => {
      try {
        const r = await apiService.getMyStores();
        lojas.value = normalize(unwrap(r));
        if (lojas.value.length) {
          lojaId.value = lojas.value[0].id;
          await load();
          refreshTimer = setInterval(() => { if (!createDialog.value && !editDialog.value) load(); }, 20000);
        }
      } catch (e) {
        error.value = e.message;
      }
    });

    return {
      lojas, lojaId, cestas, planos, assinaturas, error, saving,
      editing, createDialog, form, produtos, calculate, money, load, save, edit, reset, renew, editDialog, editForm, saveEdit, deleteDialog, planToDelete, askDelete, deletePlan,
      formatDate: d => (d ? new Date(d).toLocaleDateString('pt-BR') : '—'),
    };
  },
};
</script>
