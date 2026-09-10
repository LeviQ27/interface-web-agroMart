import { defineStore } from 'pinia';
import { productsService } from '../services/products';
import { useAppStore } from './app';
import { useStoreStore } from './stores';

const normalizeProduct = (item) => {
  const attrs = item?.attributes || item || {};
  return {
    id: item?.id || attrs.id,
    ...attrs,
    attributes: attrs,
    nome: attrs.nome || '',
    descricao: attrs.descricao || '',
    valor: Number(attrs.valor || 0),
    quantidade: Number(attrs.quantidade || 0),
    unidade_medida: attrs.unidade_medida || 'unidade',
  };
};

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    currentProduct: null,
    loading: false,
    error: null,
    cachedProducts: JSON.parse(localStorage.getItem('agromart_products') || '[]'),
    lastFetch: localStorage.getItem('agromart_products_last_fetch'),
  }),

  getters: {
    sortedProducts: (state) => [...state.products].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''))),
    availableProducts: (state) => state.products.filter(product => Number(product.quantidade || 0) > 0),
    productsByStore: (state) => (storeId) => state.products.filter(product => Number(product.loja?.id || product.loja?.data?.id) === Number(storeId)),
  },

  actions: {
    async fetchProducts(useCache = false) {
      const appStore = useAppStore();
      const storeStore = useStoreStore();
      if ((!appStore.isOnline || useCache) && this.cachedProducts.length > 0) {
        this.products = this.cachedProducts;
        return;
      }

      this.loading = true;
      this.error = null;
      try {
        const storeId = storeStore.currentStore?.id;
        const params = storeId ? { filters: { loja: { id: { $eq: storeId } } } } : {};
        const response = await productsService.getProducts(params);
        const data = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        this.products = data.map(normalizeProduct);
        this.saveToCache();
      } catch (error) {
        this.error = error.message;
        if (this.cachedProducts.length > 0) {
          this.products = this.cachedProducts;
          appStore.showSnackbar('Usando produtos salvos (sem internet)', 'warning');
        } else {
          appStore.showSnackbar('Erro ao carregar produtos', 'error');
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchProduct(id) {
      const appStore = useAppStore();
      this.loading = true;
      this.error = null;
      try {
        const response = await productsService.getProduct(id);
        this.currentProduct = normalizeProduct(response.data?.data || response.data);
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao carregar produto', 'error');
      } finally {
        this.loading = false;
      }
    },

    async createProduct(productData) {
      const appStore = useAppStore();
      const storeStore = useStoreStore();
      this.loading = true;
      this.error = null;
      try {
        const lojaId = storeStore.currentStore?.id;
        const response = await productsService.createProduct({
          ...productData,
          loja: productData.loja || lojaId,
          publishedAt: productData.publishedAt || new Date().toISOString(),
        });
        const created = normalizeProduct(response.data?.data || response.data);
        this.products.push(created);
        this.saveToCache();
        appStore.showSnackbar('Produto criado e publicado com sucesso', 'success');
        return created;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao criar produto', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProduct(id, productData) {
      const appStore = useAppStore();
      const storeStore = useStoreStore();
      this.loading = true;
      this.error = null;
      try {
        const lojaId = storeStore.currentStore?.id;
        const response = await productsService.updateProduct(id, {
          ...productData,
          loja: productData.loja || lojaId,
          publishedAt: productData.publishedAt || new Date().toISOString(),
        });
        const updated = normalizeProduct(response.data?.data || response.data);
        const index = this.products.findIndex(p => Number(p.id) === Number(id));
        if (index !== -1) this.products[index] = updated;
        this.saveToCache();
        appStore.showSnackbar('Produto atualizado com sucesso', 'success');
        return updated;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao atualizar produto', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteProduct(id) {
      const appStore = useAppStore();
      this.loading = true;
      this.error = null;
      try {
        await productsService.deleteProduct(id);
        this.products = this.products.filter(p => Number(p.id) !== Number(id));
        this.saveToCache();
        appStore.showSnackbar('Produto removido com sucesso', 'success');
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao remover produto', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    saveToCache() {
      localStorage.setItem('agromart_products', JSON.stringify(this.products));
      localStorage.setItem('agromart_products_last_fetch', new Date().toISOString());
      this.cachedProducts = this.products;
      this.lastFetch = new Date().toISOString();
    },

    clearCache() {
      localStorage.removeItem('agromart_products');
      localStorage.removeItem('agromart_products_last_fetch');
      this.cachedProducts = [];
      this.lastFetch = null;
    },
  },
});
