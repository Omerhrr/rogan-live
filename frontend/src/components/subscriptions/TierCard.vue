<script setup lang="ts">
import { computed } from 'vue';
import type { SubscriptionTier } from '@/types';

const props = defineProps<{
  tier: SubscriptionTier;
  isSubscribed?: boolean;
  isCurrent?: boolean;
}>();

const emit = defineEmits<{
  (e: 'subscribe', tierId: string): void;
  (e: 'cancel', tierId: string): void;
}>();

const colorMap: Record<string, string> = {
  Basic: '#9C27B0',
  Premium: '#E91E63',
  VIP: '#FFD700',
};

const tierColor = computed(() => colorMap[props.tier.name] || props.tier.color || '#9C27B0');
const spotsLeft = computed(() => props.tier.max_subscribers - props.tier.current_subscribers);
</script>

<template>
  <v-card class="bg-[#1E1E1E] rounded-xl overflow-hidden relative">
    <!-- Color bar -->
    <div class="h-1.5" :style="{ backgroundColor: tierColor }" />

    <div class="p-5">
      <!-- Tier name + badge -->
      <div class="flex items-center gap-2 mb-3">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: tierColor + '30' }"
        >
          <v-icon size="18" :color="tierColor">
            {{ tier.name === 'VIP' ? 'mdi-crown' : tier.name === 'Premium' ? 'mdi-star' : 'mdi-heart' }}
          </v-icon>
        </div>
        <h3 class="text-white font-bold text-lg">{{ tier.name }}</h3>
      </div>

      <!-- Price -->
      <div class="flex items-baseline gap-1 mb-4">
        <span class="text-amber-400 text-3xl font-bold">{{ tier.price_tk }}</span>
        <span class="text-gray-400 text-sm">TK/month</span>
      </div>

      <!-- Perks -->
      <ul class="space-y-2 mb-4">
        <li
          v-for="(perk, idx) in tier.perks"
          :key="idx"
          class="flex items-center gap-2"
        >
          <v-icon size="16" color="green">mdi-check-circle</v-icon>
          <span class="text-gray-300 text-sm">{{ perk }}</span>
        </li>
      </ul>

      <!-- Subscriber count -->
      <p class="text-gray-500 text-xs mb-4">
        {{ tier.current_subscribers }}/{{ tier.max_subscribers }} subscribers
        <span v-if="spotsLeft <= 10 && spotsLeft > 0" class="text-amber-400"> · {{ spotsLeft }} spots left!</span>
      </p>

      <!-- Action button -->
      <v-btn
        v-if="isCurrent"
        block
        rounded="lg"
        variant="outlined"
        color="rogan-primary"
        disabled
      >
        Current Plan
      </v-btn>
      <v-btn
        v-else-if="isSubscribed"
        block
        rounded="lg"
        variant="outlined"
        color="red"
        @click="emit('cancel', tier.id)"
      >
        Cancel Subscription
      </v-btn>
      <v-btn
        v-else
        block
        rounded="lg"
        color="rogan-primary"
        @click="emit('subscribe', tier.id)"
      >
        Subscribe
      </v-btn>
    </div>
  </v-card>
</template>
