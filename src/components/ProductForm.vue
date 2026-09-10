<template>
  <v-card class="product-form">
    <v-card-title class="text-h6 font-weight-bold">
      {{ isEditing ? 'Editar Produto' : 'Novo Produto' }}
    </v-card-title>

    <v-card-text class="pa-6">
      <v-form
        ref="form"
        v-model="valid"
        @submit.prevent="handleSubmit"
      >
        <v-row>
          <!-- Nome do produto -->
          <v-col cols="12">
            <v-text-field
              v-model="formData.nome"
              label="Nome do produto *"
              :rules="nameRules"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>

          <!-- Descrição -->
          <v-col cols="12">
            <v-textarea
              v-model="formData.descricao"
              label="Descrição"
              placeholder="Descreva seu produto: como é cultivado, benefícios, etc."
              variant="outlined"
              density="comfortable"
              rows="3"
              counter="500"
              :rules="descriptionRules"
            />
          </v-col>

          <!-- Preço e unidade de medida -->
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="formData.valor"
              label="Preço (R$) *"
              type="number"
              step="0.01"
              min="0"
              :rules="priceRules"
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
            <v-select
              v-model="formData.unidade_medida"
              :items="unidadeOptions"
              label="Unidade de medida"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <!-- Quantidade -->
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

          <!-- Upload de imagem -->
          <v-col cols="12">
            <v-file-input
              v-model="imageFile"
              label="Foto do produto"
              accept="image/*"
              variant="outlined"
              density="comfortable"
              prepend-icon="mdi-camera"
              @change="handleImageChange"
            />
            
            <!-- Preview da imagem -->
            <div
              v-if="imagePreview"
              class="mt-4"
            >
              <v-img
                :src="imagePreview"
                max-height="200"
                max-width="200"
                class="rounded"
              />
            </div>
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

export default {
  name: 'ProductForm',
  props: {
    product: {
      type: Object,
      default: null,
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref(null);
    const valid = ref(false);
    const loading = ref(false);
    const imageFile = ref(null);
    const imagePreview = ref(null);

    // Dados do formulário
    const formData = ref({
      nome: '',
      descricao: '',
      valor: null,
      unidade_medida: '',
      quantidade: null,
    });

    // Opções de unidade de medida
    const unidadeOptions = [
      'kg',
      'g',
      'unidade',
      'maço',
      'dúzia',
      'litro',
      'ml',
      'caixa',
      'saco',
    ];

    // Regras de validação
    const nameRules = [
      v => !!v || 'Nome é obrigatório',
      v => (v && v.length >= 2) || 'Nome deve ter pelo menos 2 caracteres',
      v => (v && v.length <= 100) || 'Nome deve ter no máximo 100 caracteres',
    ];

    const descriptionRules = [
      v => !v || v.length <= 500 || 'Descrição deve ter no máximo 500 caracteres',
    ];

    const priceRules = [
      v => !!v || 'Preço é obrigatório',
      v => (v && v > 0) || 'Preço deve ser maior que zero',
    ];

    const quantityRules = [
      v => v !== null && v !== undefined && v !== '' || 'Quantidade é obrigatória',
      v => (v >= 0) || 'Quantidade não pode ser negativa',
    ];

    const isEditing = computed(() => !!props.product);

    // Carregar dados do produto para edição
    const loadProductData = () => {
      if (props.product) {
        const attrs = props.product;
        formData.value = {
          nome: attrs.nome || '',
          descricao: attrs.descricao || '',
          valor: attrs.valor || null,
          unidade_medida: attrs.unidade_medida || '',
          quantidade: attrs.quantidade || null,
        };

        // Carregar imagem existente
        imagePreview.value = resolveMediaUrl(attrs.imagem);
      } else {
        // Resetar formulário para novo produto
        formData.value = {
          nome: '',
          descricao: '',
          valor: null,
          unidade_medida: '',
          quantidade: null,
        };
        imagePreview.value = null;
        imageFile.value = null;
      }
    };

    const firstFile = (value) => {
      if (!value) return null;
      if (value instanceof File) return value;
      if (Array.isArray(value)) return value[0] || null;
      if (value.target?.files?.length) return value.target.files[0];
      return null;
    };

    const resolveMediaUrl = (media) => {
      const image = media?.data?.attributes || media?.attributes || media;
      const url = image?.url || image?.formats?.medium?.url || image?.formats?.small?.url || image?.formats?.thumbnail?.url;
      if (!url) return null;
      if (url.startsWith('http')) return url;
      const baseUrl = (process.env.VUE_APP_STRAPI_API_URL || 'http://localhost:1337/api').replace(/\/api\/?$/, '');
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    };

    // Manipular mudança de imagem
    const handleImageChange = (event) => {
      const file = firstFile(event) || firstFile(imageFile.value);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.value = null;
      }
    };

    // Submeter formulário
    const handleSubmit = async () => {
      const validation = await form.value?.validate?.();
      if (validation && validation.valid === false) return;
      if (!valid.value) return;

      loading.value = true;

      try {
        const productData = { ...formData.value };
        const file = firstFile(imageFile.value);

        // Upload da imagem no Strapi antes de salvar o produto.
        // O campo `imagem` do content-type recebe o ID da mídia criada pelo plugin Upload.
        if (file) {
          const uploadResponse = await apiService.uploadFile(file);
          const uploaded = Array.isArray(uploadResponse.data) ? uploadResponse.data[0] : uploadResponse.data;
          if (uploaded?.id) productData.imagem = uploaded.id;
        }

        emit('save', productData);
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
      } finally {
        loading.value = false;
      }
    };

    // Watchers
    watch(() => props.product, loadProductData, { immediate: true });

    onMounted(() => {
      loadProductData();
    });

    return {
      form,
      valid,
      loading,
      imageFile,
      imagePreview,
      formData,
      unidadeOptions,
      nameRules,
      descriptionRules,
      priceRules,
      quantityRules,
      isEditing,
      handleImageChange,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.product-form {
  max-width: 100%;
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

