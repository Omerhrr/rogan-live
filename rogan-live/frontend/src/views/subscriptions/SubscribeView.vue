<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSubscriptionStore } from '@/stores/subscriptions';
import { useWalletStore } from '@/stores/wallet';
import TierCard from '@/components/subscriptions/TierCard.vue';
import type { SubscriptionTier, Subscription } from '@/types';

const route = useRoute();
const router = useRouter();
const subStore = useSubscriptionStore();
const walletStore = useWalletStore();

const creatorId = computed(() => route.params.creatorId as string);
const loading = ref(false);

const myActiveSubTierId = computed(() => {
  const active = subStore.mySubscriptions.find((s) => s.status === 'active');
  return active?.tier_id ?? null;
});

onMounted(async () => {
  loading.value = true;
  try {
    await subStore.fetchCreatorTiers(creatorId.value);
    await subStore.fetchMySubscriptions();
    await walletStore.fetchWallet();
  } finally {
    loading.value = false;
  }
});

async function subscribeToTier(tierId: string): Promise<void> {
  const tier = subStore.tiers.find((t) => t.id === tierId);
  if (!tier) return;

  if (walletStore.tkBalance < tier.price_tk) {
    // Insufficient balance
    return;
  }

  try {
    await subStore.subscribeToTier(tierId);
    await walletStore.fetchWallet();
  } catch {
    // Subscribe failed
  }
}

async function cancelSubscription(tierId: string): Promise<void> {
  const sub = subStore.mySubscriptions.find(
    (s) => s.tier_id === tierId && s.status === 'active'
  );
  if (!sub) return;
  await subStore.cancelSubscription(sub.id);
}

function goBack(): void {
  router.back();
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-4xl mx-auto">
    <v-btn icon variant="text" size="small" class="mb-4" @click="goBack">
      <v-icon color="white">mdi-arrow-left</v-icon>
    </v-btn>

    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-white">Choose Your Plan</h1>
      <p class="text-gray-400 text-sm mt-1">Subscribe to unlock exclusive content and perks</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
    </div>

    <div v-else-if="subStore.tiers.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-account-group</v-icon>
      <p class="text-gray-500 mt-3">This creator hasn't set up subscription tiers yet</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TierCard
        v-for="tier in subStore.tiers"
        :key="tier.id"
        :tier="tier"
        :is-subscribed="subStore.mySubscriptions.some(s => s.tier_id === tier.id && s.status === 'active')"
        :is-current="myActiveSubTierId === tier.id"
        @subscribe="subscribeToTier"
        @cancel="cancelSubscription"
      />
    </div>

    <!-- Balance Info -->
    <div class="mt-6 text-center">
      <p class="text-gray-500 text-xs">Your balance: <span class="text-amber-400">{{ walletStore.tkBalance }} TK</span></p>
    </div>
  </div>
</template>
