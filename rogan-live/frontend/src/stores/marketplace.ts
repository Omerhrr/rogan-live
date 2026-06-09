import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MarketplaceProduct, ProductPurchase, ProductType, PaginatedResponse } from '@/types';
import * as marketplaceService from '@/services/marketplace';

export const useMarketplaceStore = defineStore('marketplace', () => {
  const products = ref<MarketplaceProduct[]>([]);
  const purchases = ref<ProductPurchase[]>([]);
  const myProducts = ref<MarketplaceProduct[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const hasMore = ref(true);
  const searchQuery = ref('');
  const productType = ref<ProductType | undefined>(undefined);
  const sortBy = ref<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');

  async function fetchProducts(append: boolean = false): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
      if (!append) page.value = 1;
      const res: PaginatedResponse<MarketplaceProduct> = await marketplaceService.getProducts(
        page.value,
        12,
        productType.value,
        sortBy.value,
        searchQuery.value || undefined
      );
      const items = res.streams ?? res.items ?? [];
      if (append) {
        products.value.push(...items);
      } else {
        products.value = items;
      }
      hasMore.value = page.value < res.pages;
      page.value++;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyProducts(): Promise<void> {
    loading.value = true;
    try {
      const res = await marketplaceService.getMyProducts(1, 50);
      myProducts.value = res.streams ?? res.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchPurchases(): Promise<void> {
    loading.value = true;
    try {
      const res = await marketplaceService.getMyPurchases(1, 50);
      purchases.value = res.streams ?? res.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function createProduct(payload: {
    title: string;
    description: string;
    price_tk: number;
    product_type: ProductType;
    content_url?: string;
    thumbnail_url?: string;
    is_published?: boolean;
  }): Promise<MarketplaceProduct> {
    const product = await marketplaceService.createProduct(payload);
    myProducts.value.unshift(product);
    return product;
  }

  async function purchaseProduct(productId: string): Promise<ProductPurchase> {
    const purchase = await marketplaceService.purchaseProduct(productId);
    purchases.value.unshift(purchase);
    return purchase;
  }

  function setFilter(type?: ProductType): void {
    productType.value = type;
    products.value = [];
    page.value = 1;
    fetchProducts();
  }

  function setSort(sort: 'newest' | 'price_low' | 'price_high' | 'popular'): void {
    sortBy.value = sort;
    products.value = [];
    page.value = 1;
    fetchProducts();
  }

  function setSearch(query: string): void {
    searchQuery.value = query;
    products.value = [];
    page.value = 1;
    fetchProducts();
  }

  return {
    products,
    purchases,
    myProducts,
    loading,
    hasMore,
    searchQuery,
    productType,
    sortBy,
    fetchProducts,
    fetchMyProducts,
    fetchPurchases,
    createProduct,
    purchaseProduct,
    setFilter,
    setSort,
    setSearch,
  };
});
