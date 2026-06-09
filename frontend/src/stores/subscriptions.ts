import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SubscriptionTier, Subscription } from '@/types';
import * as subscriptionService from '@/services/subscriptions';

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const tiers = ref<SubscriptionTier[]>([]);
  const mySubscriptions = ref<Subscription[]>([]);
  const subscribers = ref<Subscription[]>([]);
  const loading = ref(false);
  const revenue = ref({ total_tk: 0, monthly_tk: 0, active_subscribers: 0 });

  const activeTiers = computed(() => tiers.value.filter((t) => t.is_active));

  async function fetchCreatorTiers(creatorId: string): Promise<void> {
    loading.value = true;
    try {
      tiers.value = await subscriptionService.getCreatorTiers(creatorId);
    } finally {
      loading.value = false;
    }
  }

  async function createTier(payload: {
    name: string;
    price_tk: number;
    perks: string[];
    max_subscribers?: number;
    color?: string;
  }): Promise<SubscriptionTier> {
    const tier = await subscriptionService.createTier(payload);
    tiers.value.push(tier);
    return tier;
  }

  async function updateTier(
    tierId: string,
    payload: Partial<SubscriptionTier>
  ): Promise<SubscriptionTier> {
    const tier = await subscriptionService.updateTier(tierId, payload);
    const idx = tiers.value.findIndex((t) => t.id === tierId);
    if (idx >= 0) tiers.value[idx] = tier;
    return tier;
  }

  async function deleteTier(tierId: string): Promise<void> {
    await subscriptionService.deleteTier(tierId);
    tiers.value = tiers.value.filter((t) => t.id !== tierId);
  }

  async function subscribeToTier(tierId: string): Promise<Subscription> {
    const sub = await subscriptionService.subscribe(tierId);
    mySubscriptions.value.unshift(sub);
    return sub;
  }

  async function cancelSubscription(subscriptionId: string): Promise<void> {
    const sub = await subscriptionService.cancelSubscription(subscriptionId);
    const idx = mySubscriptions.value.findIndex((s) => s.id === subscriptionId);
    if (idx >= 0) mySubscriptions.value[idx] = sub;
  }

  async function fetchMySubscriptions(): Promise<void> {
    loading.value = true;
    try {
      const res = await subscriptionService.getMySubscriptions();
      mySubscriptions.value = res.streams ?? res.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubscribers(): Promise<void> {
    loading.value = true;
    try {
      const res = await subscriptionService.getCreatorSubscribers();
      subscribers.value = res.streams ?? res.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchRevenue(): Promise<void> {
    try {
      revenue.value = await subscriptionService.getSubscriptionRevenue();
    } catch {
      // silently fail
    }
  }

  return {
    tiers,
    mySubscriptions,
    subscribers,
    loading,
    revenue,
    activeTiers,
    fetchCreatorTiers,
    createTier,
    updateTier,
    deleteTier,
    subscribeToTier,
    cancelSubscription,
    fetchMySubscriptions,
    fetchSubscribers,
    fetchRevenue,
  };
});
