<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { useMarketplaceStore } from '@/stores/marketplace';
import api from '@/services/api';
import type { MarketplaceProduct, ProductPurchase } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();
const marketplaceStore = useMarketplaceStore();

const productId = computed(() => route.params.id as string);
const product = ref<MarketplaceProduct | null>(null);
const loading = ref(true);
const showPurchaseDialog = ref(false);
const purchasing = ref(false);
const purchase = ref<ProductPurchase | null>(null);
const alreadyPurchased = ref(false);

const canAfford = computed(() => walletStore.tkBalance >= (product.value?.price_tk ?? 0));
const isOwner = computed(() => product.value?.creator_id === authStore.user?.id);

onMounted(async () => {
  await walletStore.fetchWallet();
  await loadProduct();
});

async function loadProduct(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.get<MarketplaceProduct>(`/marketplace/products/${productId.value}`);
    product.value = data;
    // Check if already purchased
    const purchased = marketplaceStore.purchases.find((p) => p.product_id === productId.value);
    if (purchased) {
      alreadyPurchased.value = true;
      purchase.value = purchased;
    }
  } catch {
    // Product not found
  } finally {
    loading.value = false;
  }
}

async function purchaseProduct(): Promise<void> {
  if (!product.value || !canAfford.value) return;
  purchasing.value = true;
  try {
    purchase.value = await marketplaceStore.purchaseProduct(productId.value);
    alreadyPurchased.value = true;
    showPurchaseDialog.value = false;
    await walletStore.fetchWallet();
  } catch {
    // Purchase failed
  } finally {
    purchasing.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-3xl mx-auto">
    <v-btn icon variant="text" size="small" class="mb-4" @click="router.back()">
      <v-icon color="white">mdi-arrow-left</v-icon>
    </v-btn>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <template v-else-if="product">
      <!-- Product Image -->
      <div class="rounded-xl overflow-hidden mb-6 bg-[#2D2D2D]">
        <v-img
          v-if="product.thumbnail_url"
          :src="product.thumbnail_url"
          max-height="400"
          cover
        />
        <div v-else class="h-48 flex items-center justify-center">
          <v-icon size="64" color="#3D3D3D">mdi-file-document</v-icon>
        </div>
      </div>

      <!-- Product Info -->
      <h1 class="text-2xl font-bold text-white mb-2">{{ product.title }}</h1>

      <div class="flex items-center gap-3 mb-4">
        <v-avatar size="32">
          <v-img v-if="product.creator.avatar" :src="product.creator.avatar" />
          <v-icon v-else size="20">mdi-account</v-icon>
        </v-avatar>
        <span class="text-white text-sm">{{ product.creator.display_name }}</span>
        <v-chip size="x-small" variant="flat" color="rogan-secondary">
          {{ product.product_type }}
        </v-chip>
      </div>

      <p class="text-gray-300 text-sm whitespace-pre-wrap mb-6">{{ product.description }}</p>

      <!-- Price + Purchase -->
      <v-card class="bg-[#1E1E1E] rounded-xl p-5 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-xs">Price</p>
            <div class="flex items-center gap-1">
              <v-icon size="20" color="amber">mdi-diamond-stone</v-icon>
              <span class="text-amber-400 text-2xl font-bold">{{ product.price_tk }}</span>
              <span class="text-gray-400 text-sm">TK</span>
            </div>
          </div>

          <div v-if="alreadyPurchased && purchase" class="text-right">
            <v-chip color="green" variant="flat" size="small" class="mb-1">
              <v-icon start size="14">mdi-check</v-icon>
              Purchased
            </v-chip>
            <v-btn
              color="rogan-primary"
              size="small"
              rounded="lg"
              :href="purchase.access_url"
              target="_blank"
            >
              <v-icon start size="16">mdi-download</v-icon>
              Access
            </v-btn>
          </div>

          <v-btn
            v-else-if="!isOwner"
            color="rogan-primary"
            rounded="lg"
            size="large"
            :disabled="!canAfford"
            @click="showPurchaseDialog = true"
          >
            <v-icon start>mdi-cart</v-icon>
            {{ canAfford ? 'Purchase' : 'Insufficient Balance' }}
          </v-btn>
        </div>
        <p v-if="!canAfford && !alreadyPurchased && !isOwner" class="text-red-400 text-xs mt-2">
          You need {{ (product.price_tk - walletStore.tkBalance) }} more TK
        </p>
      </v-card>

      <!-- Stats -->
      <div class="flex items-center gap-4 text-gray-500 text-xs">
        <span class="flex items-center gap-1"><v-icon size="14">mdi-shopping</v-icon> {{ product.purchase_count }} purchases</span>
      </div>
    </template>

    <!-- Purchase Confirmation Dialog -->
    <v-dialog v-model="showPurchaseDialog" max-width="380">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Confirm Purchase</span>
        </v-card-title>
        <v-card-text class="px-6" v-if="product">
          <p class="text-gray-400 text-sm mb-3">You're about to purchase:</p>
          <p class="text-white font-medium mb-3">{{ product.title }}</p>
          <div class="flex items-center justify-center gap-2 mb-3">
            <v-icon size="20" color="amber">mdi-diamond-stone</v-icon>
            <span class="text-amber-400 text-2xl font-bold">{{ product.price_tk }}</span>
            <span class="text-gray-400">TK</span>
          </div>
          <p class="text-gray-500 text-xs text-center">Current balance: {{ walletStore.tkBalance }} TK</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showPurchaseDialog = false">Cancel</v-btn>
          <v-btn
            color="rogan-primary"
            rounded="lg"
            :loading="purchasing"
            @click="purchaseProduct"
          >
            Confirm Purchase
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
