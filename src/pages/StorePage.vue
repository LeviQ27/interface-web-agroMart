<template>
  <DefaultLayout>
    <div class="store-page">
      <!-- Cabeçalho da página -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">
            Minha Loja
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Configure as informações da sua loja
          </p>
        </div>
        
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            color="secondary"
            variant="outlined"
            size="large"
            @click="startNewStore"
          >
            <v-icon class="mr-2">mdi-store-plus</v-icon>
            Nova Loja
          </v-btn>

          <v-btn
            color="success"
            variant="outlined"
            size="large"
            :disabled="!storeData.id"
            :loading="publishing"
            @click="publishStore"
          >
            <v-icon class="mr-2">mdi-cloud-upload</v-icon>
            Publicar
          </v-btn>

          <v-btn
            color="primary"
            size="large"
            :loading="saving"
            @click="saveStore"
          >
            <v-icon class="mr-2">mdi-content-save</v-icon>
            Salvar e publicar
          </v-btn>
        </div>
      </div>

      <!-- Formulário da loja -->
      <v-form
        ref="form"
        v-model="valid"
      >
        <v-row>
          <!-- Informações básicas -->
          <v-col
            cols="12"
            md="8"
          >
            <v-card
              class="mb-4"
              elevation="2"
            >
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">
                  mdi-store
                </v-icon>
                Informações Básicas
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" v-if="storeStore.stores.length > 0">
                    <v-select
                      :model-value="storeData.id"
                      :items="storeOptions"
                      label="Selecionar loja cadastrada"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      @update:model-value="selectStoreById"
                    />
                  </v-col>

                  <v-col cols="12" v-if="storeData.id">
                    <v-alert :type="isPublished ? 'success' : 'warning'" variant="tonal">
                      {{ isPublished ? 'Loja publicada e disponível no mobile.' : 'Loja em rascunho. Clique em Publicar para aparecer no mobile.' }}
                    </v-alert>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="storeData.nome"
                      label="Nome da loja *"
                      :rules="nameRules"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="storeData.descricao"
                      label="Descrição da loja"
                      placeholder="Conte sobre sua loja, seus produtos e métodos de cultivo"
                      variant="outlined"
                      density="comfortable"
                      rows="4"
                      counter="500"
                      :rules="descriptionRules"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-text-field
                      v-model="storeData.contato"
                      label="Telefone de contato *"
                      :rules="phoneRules"
                      variant="outlined"
                      density="comfortable"
                      mask="(##) #####-####"
                      required
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-text-field
                      v-model="storeData.cnpj"
                      label="CNPJ (opcional)"
                      variant="outlined"
                      density="comfortable"
                      mask="##.###.###/####-##"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-select
                      v-model="storeData.tipos_de_entrega"
                      :items="deliveryOptions"
                      label="Tipo de entrega *"
                      variant="outlined"
                      density="comfortable"
                      required
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="storeData.chave_pix"
                      label="Chave Pix da loja"
                      variant="outlined"
                      density="comfortable"
                      hint="Usada para gerar a cobrança Pix dos pedidos"
                      persistent-hint
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="storeData.nome_recebedor_pix"
                      label="Nome do recebedor Pix"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="storeData.cidade_recebedor_pix"
                      label="Cidade Pix"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>


                  <v-col cols="12">
                    <v-alert type="info" variant="tonal" class="mb-2">
                      Relações da loja: informe IDs separados por vírgula quando quiser vincular planos, assinantes, produtos ou cestas já existentes na API. Produtos e cestas criados pela interface já são vinculados automaticamente à loja selecionada.
                    </v-alert>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="relationData.planos"
                      label="IDs de planos vinculados"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Ex.: 1, 2, 3"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="relationData.assinantes"
                      label="IDs de assinantes vinculados"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Ex.: 4, 5"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="relationData.produtos"
                      label="IDs de produtos avulsos vinculados"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Ex.: 10, 11"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="relationData.cestas"
                      label="IDs de cestas vinculadas"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Ex.: 6, 7"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Endereço -->
            <v-card
              class="mb-4"
              elevation="2"
            >
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">
                  mdi-map-marker
                </v-icon>
                Endereço
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-row>
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <v-text-field
                      v-model="addressData.cep"
                      label="CEP"
                      variant="outlined"
                      density="comfortable"
                      mask="#####-###"
                      @blur="fetchAddressByCep"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="8"
                  >
                    <v-text-field
                      v-model="addressData.rua"
                      label="Rua/Avenida"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="3"
                  >
                    <v-text-field
                      v-model="addressData.numero"
                      label="Número"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="5"
                  >
                    <v-text-field
                      v-model="addressData.bairro"
                      label="Bairro"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="4"
                  >
                    <v-text-field
                      v-model="addressData.cidade"
                      label="Cidade"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="3"
                  >
                    <v-text-field
                      v-model="addressData.estado"
                      label="Estado"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col
                    cols="12"
                    md="9"
                  >
                    <v-text-field
                      v-model="addressData.complemento"
                      label="Complemento"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Banner da loja -->
          <v-col
            cols="12"
            md="4"
          >
            <v-card
              class="mb-4"
              elevation="2"
            >
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">
                  mdi-image
                </v-icon>
                Banner da Loja
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-file-input
                  v-model="bannerFile"
                  label="Escolher banner"
                  accept="image/*"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-camera"
                  @change="handleBannerChange"
                />
                
                <!-- Preview do banner -->
                <div
                  v-if="bannerPreview"
                  class="mt-4"
                >
                  <v-img
                    :src="bannerPreview"
                    height="200"
                    class="rounded"
                    cover
                  />
                </div>

                <v-alert
                  type="info"
                  variant="tonal"
                  class="mt-4"
                >
                  <v-icon class="mr-2">
                    mdi-lightbulb-outline
                  </v-icon>
                  <strong>Dica:</strong> Use uma imagem que represente bem sua loja. 
                  Recomendamos 800x400 pixels.
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Estatísticas -->
            <v-card elevation="2">
              <v-card-title class="text-h6 font-weight-bold">
                <v-icon class="mr-2">
                  mdi-chart-line
                </v-icon>
                Estatísticas
              </v-card-title>
              
              <v-card-text class="pa-4">
                <div class="text-center mb-3">
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ productStore.products.length }}
                  </div>
                  <div class="text-body-2 text-grey-darken-1">
                    Produtos cadastrados
                  </div>
                </div>

                <div class="text-center mb-3">
                  <div class="text-h4 font-weight-bold text-orange">
                    {{ basketStore.baskets.length }}
                  </div>
                  <div class="text-body-2 text-grey-darken-1">
                    Cestas disponíveis
                  </div>
                </div>

                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-success">
                    0
                  </div>
                  <div class="text-body-2 text-grey-darken-1">
                    Pedidos este mês
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import { useStoreStore } from '../store/stores';
import { useProductStore } from '../store/products';
import { useBasketStore } from '../store/baskets';
import { useAppStore } from '../store/app';
import { apiService } from '../services/api';

export default {
  name: 'StorePage',
  components: {
    DefaultLayout,
  },
  setup() {
    const storeStore = useStoreStore();
    const productStore = useProductStore();
    const basketStore = useBasketStore();
    const appStore = useAppStore();
    
    // Estado local
    const form = ref(null);
    const valid = ref(false);
    const saving = ref(false);
    const publishing = ref(false);
    const bannerFile = ref(null);
    const bannerPreview = ref(null);

    // Dados da loja
    const storeData = ref({
      id: null,
      publishedAt: null,
      nome: '',
      descricao: '',
      contato: '',
      cnpj: '',
      tipos_de_entrega: '',
      chave_pix: '',
      nome_recebedor_pix: '',
      cidade_recebedor_pix: 'BRASILIA',
    });

    // Dados do endereço
    const addressData = ref({
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: '',
    });

    const relationData = ref({
      planos: '',
      assinantes: '',
      produtos: '',
      cestas: '',
    });

    // Opções
    const deliveryOptions = [
      { title: 'Entregar no local', value: 'Entregar' },
      { title: 'Cliente retira', value: 'Receber' },
    ];

    // Regras de validação
    const nameRules = [
      v => !!v || 'Nome da loja é obrigatório',
      v => (v && v.length >= 2) || 'Nome deve ter pelo menos 2 caracteres',
    ];

    const descriptionRules = [
      v => !v || v.length <= 500 || 'Descrição deve ter no máximo 500 caracteres',
    ];

    const phoneRules = [
      v => !!v || 'Telefone é obrigatório',
      v => (v && v.replace(/\D/g, '').length >= 10) || 'Telefone deve ter pelo menos 10 dígitos',
    ];

    // Loja principal
    const mainStore = computed(() => storeStore.mainStore);
    const storeOptions = computed(() => storeStore.stores.map(store => ({ title: store.nome || store.attributes?.nome || `Loja #${store.id}`, value: store.id })));
    const isPublished = computed(() => !!storeData.value.publishedAt);
    const firstFile = (value) => {
      if (!value) return null;
      if (value instanceof File) return value;
      if (Array.isArray(value)) return value[0] || null;
      if (value.target?.files?.length) return value.target.files[0];
      return null;
    };
    const resolveMediaUrl = (media) => {
      const file = media?.data?.attributes || media?.attributes || media;
      const url = file?.url || file?.formats?.large?.url || file?.formats?.medium?.url || file?.formats?.small?.url || file?.formats?.thumbnail?.url;
      if (!url) return null;
      if (/^https?:\/\//i.test(url)) return url;
      const baseUrl = (process.env.VUE_APP_STRAPI_API_URL || 'http://localhost:1337/api').replace(/\/api\/?$/, '');
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    };
    const idsToCsv = (items = []) => Array.isArray(items) ? items.map(item => item.id || item?.data?.id).filter(Boolean).join(', ') : '';
    const csvToIds = (value = '') => String(value).split(',').map(item => Number(item.trim())).filter(Boolean);

    // Carregar dados da loja
    const loadStoreData = (store = null) => {
      const selectedStore = store || mainStore.value;
      if (selectedStore) {
        const attrs = selectedStore.attributes || selectedStore;
        storeData.value = {
          id: selectedStore.id || attrs.id || null,
          publishedAt: attrs.publishedAt || selectedStore.publishedAt || null,
          nome: attrs.nome || '',
          descricao: attrs.descricao || '',
          contato: attrs.contato || '',
          cnpj: attrs.cnpj || '',
          tipos_de_entrega: attrs.tipos_de_entrega || '',
          chave_pix: attrs.chave_pix || '',
          nome_recebedor_pix: attrs.nome_recebedor_pix || attrs.nome || '',
          cidade_recebedor_pix: attrs.cidade_recebedor_pix || 'BRASILIA',
        };

        relationData.value = {
          planos: idsToCsv(attrs.planos?.data || attrs.planos || []),
          assinantes: idsToCsv(attrs.assinantes?.data || attrs.assinantes || []),
          produtos: idsToCsv(attrs.produto_avulsos?.data || attrs.produto_avulsos || []),
          cestas: idsToCsv(attrs.cestas?.data || attrs.cestas || []),
        };

        // Carregar endereço
        if (attrs.endereco?.data || attrs.endereco) {
          const endAttrs = attrs.endereco?.data?.attributes || attrs.endereco || {};
          addressData.value = {
            cep: endAttrs.cep || '',
            rua: endAttrs.rua || '',
            numero: endAttrs.numero || '',
            bairro: endAttrs.bairro || '',
            cidade: endAttrs.cidade || '',
            estado: endAttrs.estado || '',
            complemento: endAttrs.complemento || '',
          };
        }

        // Carregar banner
        bannerPreview.value = resolveMediaUrl(attrs.banner);
        bannerFile.value = null;
      }
    };

    // Buscar endereço por CEP
    const fetchAddressByCep = async () => {
      const cep = addressData.value.cep?.replace(/\D/g, '');
      if (cep && cep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          
          if (!data.erro) {
            addressData.value = {
              ...addressData.value,
              rua: data.logradouro || '',
              bairro: data.bairro || '',
              cidade: data.localidade || '',
              estado: data.uf || '',
            };
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
        }
      }
    };

    // Manipular mudança de banner
    const handleBannerChange = (event) => {
      const file = firstFile(event) || firstFile(bannerFile.value);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          bannerPreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };

    // Salvar loja
    const saveStore = async () => {
      if (!valid.value) return;

      saving.value = true;

      try {
        const payload = {
          ...storeData.value,
          endereco: { ...addressData.value },
          regiao_administrativa: addressData.value.bairro,
          bairro: addressData.value.bairro,
          planos: csvToIds(relationData.value.planos),
          assinantes: csvToIds(relationData.value.assinantes),
          produtos: csvToIds(relationData.value.produtos),
          cestas: csvToIds(relationData.value.cestas),
          publish: true,
        };

        const file = firstFile(bannerFile.value);
        if (file) {
          const uploadResponse = await apiService.uploadFile(file);
          const uploaded = Array.isArray(uploadResponse.data) ? uploadResponse.data[0] : uploadResponse.data;
          if (uploaded?.id) payload.banner = uploaded.id;
        }

        const saved = await storeStore.upsertMyStore(payload);
        loadStoreData(saved);
      } catch (error) {
        console.error('Erro ao salvar loja:', error);
        appStore.showSnackbar('Erro ao salvar loja', 'error');
      } finally {
        saving.value = false;
      }
    };

    const resetForm = () => {
      storeData.value = {
        id: null,
        publishedAt: null,
        nome: '',
        descricao: '',
        contato: '',
        cnpj: '',
        tipos_de_entrega: '',
        chave_pix: '',
        nome_recebedor_pix: '',
        cidade_recebedor_pix: 'BRASILIA',
      };
      addressData.value = { cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '' };
      relationData.value = { planos: '', assinantes: '', produtos: '', cestas: '' };
      bannerPreview.value = null;
      bannerFile.value = null;
    };

    const startNewStore = () => {
      storeStore.newStore();
      resetForm();
      appStore.showSnackbar('Preencha os dados para criar uma nova loja', 'info');
    };

    const selectStoreById = async (id) => {
      const selected = storeStore.stores.find(store => Number(store.id) === Number(id));
      storeStore.selectStore(selected || null);
      if (selected) {
        loadStoreData();
        await Promise.all([productStore.fetchProducts(), basketStore.fetchBaskets()]);
      } else {
        resetForm();
      }
    };

    const publishStore = async () => {
      if (!storeData.value.id) return;
      publishing.value = true;
      try {
        const published = await storeStore.publishStore(storeData.value.id);
        loadStoreData(published);
      } finally {
        publishing.value = false;
      }
    };

    onMounted(async () => {
      await storeStore.fetchMyStore();
      await Promise.all([
        productStore.fetchProducts(),
        basketStore.fetchBaskets(),
      ]);
      loadStoreData();
    });

    return {
      form,
      valid,
      saving,
      publishing,
      bannerFile,
      bannerPreview,
      storeData,
      addressData,
      relationData,
      deliveryOptions,
      nameRules,
      descriptionRules,
      phoneRules,
      storeStore,
      productStore,
      basketStore,
      storeOptions,
      isPublished,
      fetchAddressByCep,
      handleBannerChange,
      saveStore,
      startNewStore,
      selectStoreById,
      publishStore,
    };
  },
};
</script>

<style scoped>
.store-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsividade */
@media (max-width: 960px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

