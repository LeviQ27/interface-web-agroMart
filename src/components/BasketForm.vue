<template>
  <v-card class="basket-form">
    <v-card-title class="text-h6 font-weight-bold">
      {{ isEditing ? 'Editar Cesta' : 'Nova Cesta' }}
    </v-card-title>

    <v-card-text class="pa-6">
      <v-form
        ref="form"
        v-model="valid"
        @submit.prevent="handleSubmit"
      >
        <v-row>
          <!-- Nome definido pelo agricultor -->
          <v-col cols="12">
            <v-text-field
              v-model="formData.nome"
              label="Nome da cesta *"
              placeholder="Ex.: Cesta da Fazenda, Cesta Família"
              :rules="nameRules"
              variant="outlined"
              required
            />
          </v-col>
          <!-- Descrição da cesta -->
          <v-col cols="12">
            <v-textarea
              v-model="formData.descricao"
              label="Descrição da cesta *"
              placeholder="Descreva o que está incluído na cesta: tipos de produtos, quantidade, etc."
              :rules="descriptionRules"
              variant="outlined"
              density="comfortable"
              rows="4"
              counter="500"
              required
            />
          </v-col>

          <!-- Preço e quantidade -->
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="basketTotal.toFixed(2)"
              readonly
              label="Preço (R$) *"
              type="number"
              step="0.01"
              min="0"
              variant="outlined"
              density="comfortable"
              prefix="R$"
              required
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="formData.quantidade"
              label="Quantidade disponível *"
              type="number"
              min="0"
              :rules="quantityRules"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>

          <v-col cols="12">
            <h3 class="text-subtitle-1 mb-2">
              Produtos da cesta
            </h3>
            <div
              v-for="(item, index) in formData.composicao"
              :key="index"
              class="d-flex align-center ga-2"
            >
              <v-select
                v-model="item.produtoId"
                :items="availableProducts"
                item-title="nome"
                item-value="id"
                label="Produto"
                class="flex-grow-1"
              />
              <v-text-field
                :model-value="displayQuantity(item)"
                type="number"
                step="any"
                min="0.01"
                label="Quantidade"
                style="max-width:125px"
                @update:model-value="setDisplayQuantity(item, $event)"
              />
              <v-select
                v-if="isWeight(item.produtoId)"
                v-model="item.unidadeEntrada"
                :items="['kg', 'g']"
                label="Medida"
                style="max-width:95px"
                @update:model-value="updateUnit(item)"
              />
              <v-text-field
                :model-value="unitFor(item.produtoId)"
                label="Unidade"
                readonly
                style="max-width:115px"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="formData.composicao.splice(index, 1)"
              />
            </div>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-plus"
              @click="formData.composicao.push({ produtoId: null, quantidade: 1 })"
            >
              Adicionar produto à cesta
            </v-btn>
            <p class="text-caption mt-2">
              Informe a composição para que os planos calculem automaticamente o preço das cestas selecionadas.
            </p>
          </v-col>
          <!-- Upload de imagens -->
          <v-col cols="12">
            <v-file-input
              v-model="imageFiles"
              label="Fotos da cesta"
              accept="image/*"
              multiple
              variant="outlined"
              density="comfortable"
              prepend-icon="mdi-camera"
              @change="handleImageChange"
            />
            
            <!-- Preview das imagens -->
            <div
              v-if="imagePreviews.length > 0"
              class="mt-4"
            >
              <v-row>
                <v-col
                  v-for="(preview, index) in imagePreviews"
                  :key="index"
                  cols="6"
                  sm="4"
                  md="3"
                >
                  <div class="image-preview-container">
                    <v-img
                      :src="preview"
                      height="120"
                      class="rounded"
                      cover
                    />
                    <v-btn
                      icon
                      size="small"
                      color="error"
                      class="remove-image-btn"
                      @click="removeImage(index)"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>

          <!-- Dicas para o agricultor -->
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <v-icon class="mr-2">
                mdi-lightbulb-outline
              </v-icon>
              <strong>Dica:</strong> Descreva bem o que está incluído na cesta. 
              Exemplo: "2kg de tomates, 1kg de alface, 500g de cenoura, 1 maço de coentro"
            </v-alert>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions class="pa-6 pt-0">
      <v-spacer />
      
      <v-btn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
      >
        Cancelar
      </v-btn>
      
      <v-btn
        color="primary"
        size="large"
        :loading="loading"
        :disabled="!valid"
        @click="handleSubmit"
      >
        {{ isEditing ? 'Salvar' : 'Criar' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { apiService } from '../services/api';
import { useProductStore } from '../store/products';

export default {
  name: 'BasketForm',
  props: {
    basket: {
      type: Object,
      default: null,
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const productStore = useProductStore();
    const availableProducts = computed(() => productStore.products);
    const isWeight = id => ['kg', 'quilo', 'quilograma'].includes(String(unitFor(id)).toLowerCase());
    const displayQuantity = item => item.unidadeEntrada === 'g' && isWeight(item.produtoId) ? Number((Number(item.quantidade || 0) * 1000).toFixed(3)) : item.quantidade;
    const setDisplayQuantity = (item, value) => { item.quantidade = Math.max(0, Number(value || 0)) / (item.unidadeEntrada === 'g' && isWeight(item.produtoId) ? 1000 : 1); };
    const updateUnit = item => { if (!isWeight(item.produtoId)) item.unidadeEntrada = 'kg'; };
    const unitFor = id => availableProducts.value.find(p => Number(p.id) === Number(id))?.unidade_medida || 'unidade';
    const basketTotal = computed(() => Math.round((formData.value.composicao || []).reduce((sum, item) => {
      const product = availableProducts.value.find(p => Number(p.id) === Number(item.produtoId));
      return sum + Number(product?.valor || 0) * Number(item.quantidade || 0);
    }, 0) * 100) / 100);
    const form = ref(null);
    const valid = ref(false);
    const loading = ref(false);
    const imageFiles = ref([]);
    const imagePreviews = ref([]);

    // Dados do formulário
    const formData = ref({
      nome: '',
      descricao: '',
      valor: null,
      quantidade: null,
      composicao: [],
    });

    // Regras de validação
    const nameRules = [v => !!String(v || '').trim() || 'Informe o nome da cesta'];
    const descriptionRules = [
      v => !!v || 'Descrição é obrigatória',
      v => (v && v.length >= 10) || 'Descrição deve ter pelo menos 10 caracteres',
      v => (v && v.length <= 500) || 'Descrição deve ter no máximo 500 caracteres',
    ];


    const quantityRules = [
      v => v !== null && v !== undefined && v !== '' || 'Quantidade é obrigatória',
      v => (v >= 0) || 'Quantidade não pode ser negativa',
    ];

    const isEditing = computed(() => !!props.basket);

    // Carregar dados da cesta para edição
    const loadBasketData = () => {
      if (props.basket) {
        const attrs = props.basket;
        formData.value = {
          nome: attrs.nome || '',
          descricao: attrs.descricao || '',
          valor: attrs.valor || null,
          quantidade: attrs.quantidade ?? null,
          composicao: Array.isArray(attrs.composicao) ? attrs.composicao.map(i => ({ produtoId: Number(i.produtoId), quantidade: Number(i.quantidade) })) : [],
        };

        // Carregar imagens existentes
        if (attrs.imagem?.data && attrs.imagem.data.length > 0) {
          const baseUrl = process.env.VUE_APP_STRAPI_URL || 'http://localhost:1337';
          imagePreviews.value = attrs.imagem.data.map(image => 
            image.attributes.url.startsWith('http') 
              ? image.attributes.url 
              : `${baseUrl}${image.attributes.url}`,
          );
        }
      } else {
        // Resetar formulário para nova cesta
        formData.value = {
          nome: '',
          descricao: '',
          valor: null,
          quantidade: null,
          composicao: [],
        };
        imagePreviews.value = [];
        imageFiles.value = [];
      }
    };

    // Manipular mudança de imagens
    const handleImageChange = (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        // Limpar previews anteriores se for upload novo
        if (!isEditing.value) {
          imagePreviews.value = [];
        }

        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePreviews.value.push(e.target.result);
          };
          reader.readAsDataURL(file);
        });
      }
    };

    // Remover imagem
    const removeImage = (index) => {
      imagePreviews.value.splice(index, 1);
      if (imageFiles.value && imageFiles.value.length > index) {
        const newFiles = Array.from(imageFiles.value);
        newFiles.splice(index, 1);
        imageFiles.value = newFiles;
      }
    };

    // Submeter formulário
    const handleSubmit = async () => {
      const validation = await form.value?.validate?.();
      if (validation && validation.valid === false) return;

      loading.value = true;

      try {
        if (!formData.value.composicao.length || basketTotal.value <= 0) {
          alert('Adicione produtos e quantidades válidas à cesta.');
          return;
        }
        let basketData = { ...formData.value, valor: basketTotal.value };

        // Upload das imagens se houver
        const selectedFiles = Array.from(imageFiles.value || []).filter(file => file && typeof file.arrayBuffer === 'function');
        if (selectedFiles.length) {
          const uploadResponses = await Promise.all(selectedFiles.map(file => apiService.uploadFile(file)));
          const ids = uploadResponses.flatMap(response => Array.isArray(response.data) ? response.data : [response.data]).map(media => media?.id).filter(Boolean);
          if (ids.length !== selectedFiles.length) throw new Error('Upload de imagem não retornou identificadores válidos.');
          const previousMedia = props.basket?.imagem?.data || props.basket?.imagem || [];
          const previousIds = (Array.isArray(previousMedia) ? previousMedia : [previousMedia]).map(item => Number(item?.id)).filter(Boolean);
          basketData.imagem = [...previousIds, ...ids];
        }

        emit('save', basketData);
      } catch (error) {
        console.error('Erro ao salvar cesta:', error);
        alert(error.response?.data?.error?.message || error.message || 'Erro ao enviar imagem da cesta.');
      } finally {
        loading.value = false;
      }
    };

    // Watchers
    watch(() => props.basket, loadBasketData, { immediate: true });

    onMounted(() => {
      productStore.fetchProducts();
      loadBasketData();
    });

    return {
      form,
      availableProducts,
      basketTotal,
      unitFor, isWeight, displayQuantity, setDisplayQuantity, updateUnit,
      valid,
      loading,
      imageFiles,
      imagePreviews,
      formData,
      nameRules,
      descriptionRules,
      quantityRules,
      isEditing,
      handleImageChange,
      removeImage,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.basket-form {
  max-width: 100%;
}

.image-preview-container {
  position: relative;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

/* Responsividade */
@media (max-width: 600px) {
  .v-card-text {
    padding: 16px !important;
  }
  
  .v-card-actions {
    padding: 16px !important;
    padding-top: 0 !important;
  }
}
</style>

