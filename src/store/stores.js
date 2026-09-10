import { defineStore } from 'pinia';
import { apiService } from '../services/api';
import { useAppStore } from './app';

const normalizeStore = (item) => {
  const attrs = item?.attributes || item || {};
  return { id: item?.id || attrs.id, attributes: attrs, ...attrs };
};

export const useStoreStore = defineStore('stores', {
  state: () => ({
    stores: [],
    currentStore: null,
    loading: false,
    error: null,
    cachedStores: JSON.parse(localStorage.getItem('agromart_stores') || '[]'),
    lastFetch: localStorage.getItem('agromart_stores_last_fetch'),
  }),

  getters: {
    sortedStores: (state) => [...state.stores].sort((a, b) => String(a.attributes?.nome || '').localeCompare(String(b.attributes?.nome || ''))),
    mainStore: (state) => state.currentStore || (state.stores.length > 0 ? state.stores[0] : null),
    myStores: (state) => state.stores,
  },

  actions: {
    async fetchStores(useCache = false) {
      const appStore = useAppStore();
      if (!appStore.isOnline || useCache) {
        if (this.cachedStores.length > 0) {
          this.stores = this.cachedStores;
          return;
        }
      }

      this.loading = true;
      this.error = null;
      try {
        const response = await apiService.getStores();
        const data = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        this.stores = data.map(normalizeStore);
        this.saveToCache();
      } catch (error) {
        this.error = error.message;
        if (this.cachedStores.length > 0) {
          this.stores = this.cachedStores;
          appStore.showSnackbar('Usando dados salvos (sem internet)', 'warning');
        } else {
          appStore.showSnackbar('Erro ao carregar lojas', 'error');
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchMyStore() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiService.getMyStore();
        const raw = response.data?.data || response.data;
        const lojas = Array.isArray(response.data?.meta?.lojas) ? response.data.meta.lojas.map(normalizeStore) : [];
        this.stores = lojas.length ? lojas : this.stores;
        this.currentStore = raw ? normalizeStore(raw) : (lojas[0] || null);
        if (this.currentStore && !this.stores.some(store => Number(store.id) === Number(this.currentStore.id))) {
          this.stores = [this.currentStore, ...this.stores];
        }
        this.saveToCache();
        return this.currentStore;
      } catch (error) {
        this.error = error.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchMyStores() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiService.getMyStores();
        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        this.stores = data.map(normalizeStore);
        if (!this.currentStore && this.stores.length) this.currentStore = this.stores[0];
        this.saveToCache();
        return this.stores;
      } catch (error) {
        this.error = error.message;
        return [];
      } finally {
        this.loading = false;
      }
    },

    selectStore(store) {
      this.currentStore = store ? normalizeStore(store) : null;
    },

    newStore() {
      this.currentStore = null;
    },

    async fetchStore(id) {
      const appStore = useAppStore();
      this.loading = true;
      this.error = null;
      try {
        const response = await apiService.getStore(id);
        this.currentStore = normalizeStore(response.data?.data || response.data);
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao carregar loja', 'error');
      } finally {
        this.loading = false;
      }
    },

    async updateStore(id, storeData) {
      const appStore = useAppStore();
      this.loading = true;
      this.error = null;
      try {
        const response = id ? await apiService.updateStore(id, storeData) : await apiService.upsertMyStore(storeData);
        const updated = normalizeStore(response.data?.data || response.data);
        const index = this.stores.findIndex(s => Number(s.id) === Number(updated.id));
        if (index !== -1) this.stores[index] = updated;
        else this.stores.unshift(updated);
        this.currentStore = updated;
        this.saveToCache();
        appStore.showSnackbar('Loja atualizada com sucesso', 'success');
        return updated;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao atualizar loja', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async upsertMyStore(storeData) {
      const appStore = useAppStore();
      this.loading = true;
      try {
        const response = storeData.id ? await apiService.updateStore(storeData.id, storeData) : await apiService.createStore({ ...storeData, publish: true });
        const updated = normalizeStore(response.data?.data || response.data);
        this.currentStore = updated;
        const index = this.stores.findIndex(s => Number(s.id) === Number(updated.id));
        if (index !== -1) this.stores[index] = updated;
        else this.stores.unshift(updated);
        this.saveToCache();
        appStore.showSnackbar('Loja salva e publicada com sucesso', 'success');
        return updated;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao salvar loja', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async publishStore(id) {
      const appStore = useAppStore();
      this.loading = true;
      try {
        const response = await apiService.publishStore(id);
        const updated = normalizeStore(response.data?.data || response.data);
        const index = this.stores.findIndex(s => Number(s.id) === Number(updated.id));
        if (index !== -1) this.stores[index] = updated;
        this.currentStore = updated;
        this.saveToCache();
        appStore.showSnackbar('Loja publicada com sucesso', 'success');
        return updated;
      } catch (error) {
        this.error = error.message;
        appStore.showSnackbar('Erro ao publicar loja', 'error');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    saveToCache() {
      localStorage.setItem('agromart_stores', JSON.stringify(this.stores));
      localStorage.setItem('agromart_stores_last_fetch', new Date().toISOString());
      this.cachedStores = this.stores;
      this.lastFetch = new Date().toISOString();
    },

    clearCache() {
      localStorage.removeItem('agromart_stores');
      localStorage.removeItem('agromart_stores_last_fetch');
      this.cachedStores = [];
      this.lastFetch = null;
    },
  },
});
