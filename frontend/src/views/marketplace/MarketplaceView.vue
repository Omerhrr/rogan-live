<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMarketplaceStore } from '@/stores/marketplace';
import { useResponsive } from '@/composables/useResponsive';
import ProductCard from '@/components/marketplace/ProductCard.vue';
import type { ProductType } from '@/types';

const router = useRouter();
const marketplaceStore = useMarketplaceStore();
const { isMobile } = useResponsive();
const searchInput = ref('');
const selectedType = ref<ProductType | undefined>(undefined);
const selectedSort = ref<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');

const productTypes: { label: string; value: ProductType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Digital', value: 'digital' },
  { label: 'Pay-Per-View', value: 'payperview' },
  { label: 'Custom', value: 'custom' },
];

const sortOptions = [
  { label: 'Newest', value: 'newest' as const },
  { label: 'Price: Low', value: 'price_low' as const },
  { label: 'Price: High', value: 'price_high' as const },
  { label: 'Popular', value: 'popular' as const },
];

onMounted(() => {
  marketplaceStore.fetchProducts();
});

function setFilter(type?: ProductType): void {
  selectedType.value = type;
  marketplaceStore.productType = type;
  marketplaceStore.products = [];
  marketplaceStore.fetchProducts();
}

function setSort(sort: 'newest' | 'price_low' | 'price_high' | 'popular'): void {
  selectedSort.value = sort;
  marketplaceStore.setSort(sort);
}

function handleSearch(): void {
  marketplaceStore.setSearch(searchInput.value);
}

function goToProduct(productId: string): void {
  router.push(`/marketplace/${productId}`);
}
</script>

<template>
  <!-- Desktop Layout -->
  <div v-if="!isMobile" class="h-full overflow-y-auto">
    <div class="px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Marketplace</h1>
          <p class="text-gray-400 text-sm mt-1">Browse digital products and services</p>
        </div>
      </div>

      <div class="space-y-4 mb-8">
        <v-text-field v-model="searchInput" placeholder="Search products..."
          prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" hide-details flat
          bg-color="#1E1E1E" rounded="lg" class="max-w-lg" @keydown.enter="handleSearch" />

        <div class="flex flex-wrap items-center gap-2">
          <v-btn v-for="pt in productTypes" :key="pt.label" size="small"
            :variant="selectedType === pt.value ? 'flat' : 'outlined'"
            :color="selectedType === pt.value ? 'rogan-primary' : 'gray'" rounded="lg"
            @click="setFilter(pt.value)"
          >
            {{ pt.label }}
          </v-btn>
          <v-spacer />
          <v-select v-model="selectedSort" :items="sortOptions" item-title="label" item-value="value"
            density="compact" variant="solo-filled" hide-details flat bg-color="#1E1E1E"
            class="max-w-[160px]" rounded="lg" @update:model-value="setSort" />
        </div>
      </div>

      <div v-if="marketplaceStore.loading && marketplaceStore.products.length === 0" class="text-center py-12">
        <v-progress-circular indeterminate color="rogan-primary" size="48" />
      </div>

      <div v-else-if="marketplaceStore.products.length === 0" class="text-center py-12">
        <v-icon size="56" color="#3D3D3D">mdi-store-outline</v-icon>
        <p class="text-gray-500 mt-3">No products found</p>
      </div>

      <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <ProductCard v-for="product in marketplaceStore.products" :key="product.id" :product="product" @click="goToProduct" />
      </div>

      <div v-if="marketplaceStore.hasMore" class="text-center mt-8">
        <v-btn variant="outlined" rounded="lg" @click="marketplaceStore.fetchProducts(true)" :loading="marketplaceStore.loading">
          Load More
        </v-btn>
      </div>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="min-h-screen bg-[#121212] p-4 max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Marketplace</h1>
        <p class="text-gray-400 text-sm mt-0.5">Browse digital products and services</p>
      </div>
    </div>

    <div class="space-y-3 mb-6">
      <v-text-field v-model="searchInput" placeholder="Search products..."
        prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" hide-details flat
        bg-color="#2D2D2D" rounded="lg" @keydown.enter="handleSearch" />

      <div class="flex flex-wrap gap-2">
        <v-btn v-for="pt in productTypes" :key="pt.label" size="small"
          :variant="selectedType === pt.value ? 'flat' : 'outlined'"
          :color="selectedType === pt.value ? 'rogan-primary' : 'gray'" rounded="lg"
          @click="setFilter(pt.value)"
        >
          {{ pt.label }}
        </v-btn>
        <v-spacer />
        <v-select v-model="selectedSort" :items="sortOptions" item-title="label" item-value="value"
          density="compact" variant="solo-filled" hide-details flat bg-color="#2D2D2D"
          class="max-w-[140px]" rounded="lg" @update:model-value="setSort" />
      </div>
    </div>

    <div v-if="marketplaceStore.loading && marketplaceStore.products.length === 0" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
    </div>

    <div v-else-if="marketplaceStore.products.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-store-outline</v-icon>
      <p class="text-gray-500 mt-3">No products found</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ProductCard v-for="product in marketplaceStore.products" :key="product.id" :product="product" @click="goToProduct" />
    </div>

    <div v-if="marketplaceStore.hasMore" class="text-center mt-6">
      <v-btn variant="outlined" rounded="lg" @click="marketplaceStore.fetchProducts(true)" :loading="marketplaceStore.loading">
        Load More
      </v-btn>
    </div>
  </div>
</template>
