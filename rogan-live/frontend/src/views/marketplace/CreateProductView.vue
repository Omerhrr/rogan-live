<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMarketplaceStore } from '@/stores/marketplace';
import type { ProductType } from '@/types';

const router = useRouter();
const marketplaceStore = useMarketplaceStore();

const title = ref('');
const description = ref('');
const price = ref(100);
const productType = ref<ProductType>('digital');
const contentUrl = ref('');
const thumbnailUrl = ref('');
const isPublished = ref(true);
const loading = ref(false);

const productTypes: { label: string; value: ProductType }[] = [
  { label: 'Digital Download', value: 'digital' },
  { label: 'Pay-Per-View', value: 'payperview' },
  { label: 'Custom Content', value: 'custom' },
];

async function submitProduct(): Promise<void> {
  if (!title.value.trim() || !description.value.trim()) return;
  loading.value = true;
  try {
    const product = await marketplaceStore.createProduct({
      title: title.value,
      description: description.value,
      price_tk: price.value,
      product_type: productType.value,
      content_url: contentUrl.value || undefined,
      thumbnail_url: thumbnailUrl.value || undefined,
      is_published: isPublished.value,
    });
    router.push(`/marketplace/${product.id}`);
  } catch {
    // Error
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-2xl mx-auto">
    <v-btn icon variant="text" size="small" class="mb-4" @click="router.back()">
      <v-icon color="white">mdi-arrow-left</v-icon>
    </v-btn>

    <h1 class="text-2xl font-bold text-white mb-6">Create Product</h1>

    <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
      <div class="space-y-4">
        <v-text-field
          v-model="title"
          label="Product Title"
          placeholder="Name your product"
          variant="solo-filled"
          bg-color="#2D2D2D"
        />

        <v-textarea
          v-model="description"
          label="Description"
          placeholder="Describe what buyers will get..."
          variant="solo-filled"
          bg-color="#2D2D2D"
          rows="4"
        />

        <v-select
          v-model="productType"
          :items="productTypes"
          item-title="label"
          item-value="value"
          label="Product Type"
          variant="solo-filled"
          bg-color="#2D2D2D"
        />

        <div>
          <label class="text-gray-400 text-sm mb-1 block">Price (TK)</label>
          <v-slider
            v-model="price"
            :min="10"
            :max="50000"
            :step="10"
            thumb-label
            color="rogan-primary"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>10 TK</span>
            <span class="text-amber-400 font-bold">{{ price }} TK</span>
            <span>50,000 TK</span>
          </div>
        </div>

        <v-text-field
          v-model="contentUrl"
          label="Content URL"
          placeholder="https://example.com/content"
          variant="solo-filled"
          bg-color="#2D2D2D"
          hint="URL to the digital content (file, video, etc.)"
          persistent-hint
        />

        <v-text-field
          v-model="thumbnailUrl"
          label="Thumbnail URL"
          placeholder="https://example.com/thumbnail.jpg"
          variant="solo-filled"
          bg-color="#2D2D2D"
        />

        <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
          <div>
            <p class="text-white text-sm font-medium">Publish Immediately</p>
            <p class="text-gray-500 text-xs">Save as draft to publish later</p>
          </div>
          <v-switch v-model="isPublished" color="rogan-primary" hide-details />
        </div>

        <v-btn
          color="rogan-primary"
          block
          rounded="lg"
          size="large"
          :loading="loading"
          :disabled="!title.trim() || !description.trim()"
          @click="submitProduct"
        >
          <v-icon start>mdi-store</v-icon>
          {{ isPublished ? 'Publish Product' : 'Save as Draft' }}
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
