import { defineStore } from 'pinia';
import { apiService } from '../services/api';
import { useAppStore } from './app';
import { useStoreStore } from './stores';

const normalizeBasket = (item) => {
  const attrs = item?.attributes || item || {};
  return {
    id: item?.id || attrs.id,
    ...attrs,
    attributes: attrs,
    descricao: attrs.descricao || '',
    valor: Number(attrs.valor || 0),
    quantidade: Number(attrs.quantidade || 0),
  };
};

export const useBasketStore = defineStore('baskets', {
  state: () => ({
    baskets: [],
    currentBasket: null,
    loading: false,
    error: null,
    cachedBaskets: JSON.parse(localStorage.getItem('agromart_baskets') || '[]'),
    lastFetch: localStorage.getItem('agromart_baskets_last_fetch'),
  }),

  getters: {
    sortedBaskets: (state) => [...state.baskets].sort((a, b) => Number(a.valor || 0) - Number(b.valor || 0)),
    availableBaskets: (state) => state.baskets.filter(basket => Number(basket.quantidade || 0) > 0),
    basketsByStore: (state) => (storeId) => state.baskets.filter(basket => Number(basket.loja?.id || basket.loja?.data?.id) === Number(storeId)),
  },

  actions: {
    async fetchBaskets(useCache = false) {
      const appStore = useAppStore();
      const storeStore = useStoreStore();
      if ((!appStore.isOnline || useCache) && this.cachedBaskets.length > 0) {
        this.baskets = this.cachedBaskets;
        return;
      }

      this.loading = true;
      this.error = null;
      try {
        const storeId = storeStore.currentStore?.id;
        const params = storeId ? { filters: { loja: { id: { $eq: storeId } } } } : {};
        const response = await apiService.getBaskets(params);
        const data = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        this.baskets = data.map(normalizeBasket);
        this.saveToCache();
      } catch (error) {
        this.error = error.message;
        if (this.cachedBaskets.length > 0) {
          this.baskets = this.cachedBaskets;
          appStore.showSnackbar('Usando cestas salvas (sem internet)', 'warning');
        } else {
          appStore.showSnackbar('Erro ao carregar cestas', 'error');
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchBasket(id) {
      const appStore = useAppStore();
      this.loading = true;
      this.error = null;
      try {
        const response = await apiService.getBasket(id);
        this.currentBasket = normalizeBasket(response.data?.data || response.data);
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao carregar cesta', 'error');
      } finally {
        this.loading = false;
      }
    },

    async createBasket(basketData) {
      const appStore = useAppStore();
      const storeStore = useStoreStore();
      this.loading = true;
      this.error = null;
      try {
        const lojaId = storeStore.currentStore?.id;
        const response = await apiService.createBasket({
          ...basketData,
          loja: basketData.loja || lojaId,
          publishedAt: basketData.publishedAt || new Date().toISOString(),
        });
        const created = normalizeBasket(response.data?.data || response.data);
        this.baskets.push(created);
        this.saveToCache();
        appStore.showSnackbar('Cesta criada e publicada com sucesso', 'success');
        return created;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao criar cesta', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateBasket(id, basketData) {
      const appStore = useAppStore();
      const storeStore = useStoreStore();
      this.loading = true;
      this.error = null;
      try {
        const lojaId = storeStore.currentStore?.id;
        const response = await apiService.updateBasket(id, {
          ...basketData,
          loja: basketData.loja || lojaId,
          publishedAt: basketData.publishedAt || new Date().toISOString(),
        });
        const updated = normalizeBasket(response.data?.data || response.data);
        const index = this.baskets.findIndex(b => Number(b.id) === Number(id));
        if (index !== -1) this.baskets[index] = updated;
        this.saveToCache();
        appStore.showSnackbar('Cesta atualizada com sucesso', 'success');
        return updated;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao atualizar cesta', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteBasket(id) {
      const appStore = useAppStore();
      this.loading = true;
      this.error = null;
      try {
        await apiService.deleteBasket(id);
        this.baskets = this.baskets.filter(b => Number(b.id) !== Number(id));
        this.saveToCache();
        appStore.showSnackbar('Cesta removida com sucesso', 'success');
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao remover cesta', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    saveToCache() {
      localStorage.setItem('agromart_baskets', JSON.stringify(this.baskets));
      localStorage.setItem('agromart_baskets_last_fetch', new Date().toISOString());
      this.cachedBaskets = this.baskets;
      this.lastFetch = new Date().toISOString();
    },

    clearCache() {
      localStorage.removeItem('agromart_baskets');
      localStorage.removeItem('agromart_baskets_last_fetch');
      this.cachedBaskets = [];
      this.lastFetch = null;
    },
  },
});
