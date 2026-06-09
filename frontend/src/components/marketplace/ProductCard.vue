<script setup lang="ts">
import { computed } from 'vue';
import type { MarketplaceProduct } from '@/types';

const props = defineProps<{
  product: MarketplaceProduct;
}>();

const emit = defineEmits<{
  (e: 'click', productId: string): void;
}>();

const typeIcons: Record<string, string> = {
  digital: 'mdi-file-download',
  payperview: 'mdi-eye',
  custom: 'mdi-palette',
};

const typeColors: Record<string, string> = {
  digital: 'blue',
  payperview: 'rogan-primary',
  custom: 'rogan-secondary',
};
</script>

<template>
  <v-card
    class="bg-[#1E1E1E] rounded-xl overflow-hidden cursor-pointer hover:bg-[#252525] transition-colors"
    @click="emit('click', product.id)"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-video bg-[#2D2D2D]">
      <v-img
        v-if="product.thumbnail_url"
        :src="product.thumbnail_url"
        cover
        class="w-full h-full"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <v-icon size="40" color="#3D3D3D">{{ typeIcons[product.product_type] || 'mdi-file' }}</v-icon>
      </div>

      <!-- Type badge -->
      <v-chip
        size="x-small"
        :color="typeColors[product.product_type] || 'gray'"
        variant="flat"
        class="absolute top-2 left-2"
      >
        {{ product.product_type }}
      </v-chip>

      <!-- Price -->
      <div class="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded">
        <span class="text-amber-400 text-sm font-bold">{{ product.price_tk }} TK</span>
      </div>
    </div>

    <div class="p-3">
      <h3 class="text-white text-sm font-medium truncate">{{ product.title }}</h3>
      <p class="text-gray-500 text-xs mt-1 line-clamp-2">{{ product.description }}</p>

      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center gap-1">
          <v-avatar size="20">
            <v-img v-if="product.creator.avatar" :src="product.creator.avatar" />
            <v-icon v-else size="14">mdi-account</v-icon>
          </v-avatar>
          <span class="text-gray-400 text-xs">{{ product.creator.display_name }}</span>
        </div>
        <span class="text-gray-600 text-xs">{{ product.purchase_count }} sold</span>
      </div>
    </div>
  </v-card>
</template>
