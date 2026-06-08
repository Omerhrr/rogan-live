<script setup lang="ts">
import { ref } from 'vue';
import type { GiftType, GiftOption } from '@/types';

const props = defineProps<{
  streamId: string;
}>();

const emit = defineEmits<{
  send: [giftType: GiftType, quantity: number];
}>();

const selectedQuantity = ref(1);

const giftOptions: GiftOption[] = [
  { type: 'rose', name: 'Rose', icon: '🌹', tk_price: 1, color: '#E91E63', animation_class: 'animate-gift-float-up' },
  { type: 'heart', name: 'Heart', icon: '❤️', tk_price: 5, color: '#FF4081', animation_class: 'animate-gift-float-up' },
  { type: 'diamond', name: 'Diamond', icon: '💎', tk_price: 10, color: '#00BCD4', animation_class: 'animate-gift-float-up' },
  { type: 'rocket', name: 'Rocket', icon: '🚀', tk_price: 50, color: '#FF9800', animation_class: 'animate-rocket-launch' },
  { type: 'crown', name: 'Crown', icon: '👑', tk_price: 100, color: '#FFD700', animation_class: 'animate-crown-land' },
];

const sendingGift = ref<GiftType | null>(null);

function selectGift(type: GiftType): void {
  sendingGift.value = type;
  emit('send', type, selectedQuantity.value);

  // Animation feedback
  setTimeout(() => {
    sendingGift.value = null;
  }, 500);
}

const quantities = [1, 5, 10, 50];
</script>

<template>
  <div class="bg-[#1E1E1E] rounded-t-2xl p-4">
    <!-- Quantity selector -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-gray-400 font-medium">Quantity</span>
      <div class="flex gap-2">
        <v-chip
          v-for="q in quantities"
          :key="q"
          :color="selectedQuantity === q ? 'rogan-primary' : '#3D3D3D'"
          :variant="selectedQuantity === q ? 'flat' : 'outlined'"
          size="small"
          class="cursor-pointer"
          @click="selectedQuantity = q"
        >
          x{{ q }}
        </v-chip>
      </div>
    </div>

    <!-- Gift grid -->
    <div class="grid grid-cols-5 gap-3">
      <button
        v-for="gift in giftOptions"
        :key="gift.type"
        class="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200"
        :class="[
          sendingGift === gift.type
            ? 'bg-rogan-primary/20 scale-110'
            : 'bg-[#2D2D2D] hover:bg-[#3D3D3D]',
        ]"
        @click="selectGift(gift.type)"
      >
        <span class="text-2xl">{{ gift.icon }}</span>
        <span class="text-[10px] text-white font-medium">{{ gift.name }}</span>
        <span class="text-[10px] text-amber-400 flex items-center gap-0.5">
          <v-icon size="10">mdi-diamond-stone</v-icon>
          {{ gift.tk_price }}
        </span>
      </button>
    </div>

    <!-- Total display -->
    <div class="mt-4 pt-3 border-t border-[#3D3D3D] flex items-center justify-between">
      <span class="text-sm text-gray-400">Total</span>
      <span class="text-lg font-bold text-amber-400 flex items-center gap-1">
        <v-icon size="16" color="amber">mdi-diamond-stone</v-icon>
        {{ giftOptions.find(g => g.type === 'rose')!.tk_price * selectedQuantity }}
      </span>
    </div>
  </div>
</template>
