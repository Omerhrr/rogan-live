<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { GiftType } from '@/types';

const props = defineProps<{
  giftType: GiftType;
  position: { x: number; y: number };
  senderName?: string;
}>();

const emit = defineEmits<{
  done: [];
}>();

const giftConfig: Record<GiftType, { icon: string; color: string; animationClass: string }> = {
  rose: { icon: '🌹', color: '#E91E63', animationClass: 'animate-gift-float-up' },
  heart: { icon: '❤️', color: '#FF4081', animationClass: 'animate-gift-float-up' },
  diamond: { icon: '💎', color: '#00BCD4', animationClass: 'animate-gift-float-up' },
  rocket: { icon: '🚀', color: '#FF9800', animationClass: 'animate-rocket-launch' },
  crown: { icon: '👑', color: '#FFD700', animationClass: 'animate-crown-land' },
};

const config = computed(() => giftConfig[props.giftType]);

onMounted(() => {
  setTimeout(() => {
    emit('done');
  }, 3000);
});
</script>

<template>
  <div
    :class="[config.animationClass, 'absolute pointer-events-none z-50 flex flex-col items-center']"
    :style="{
      left: position.x + '%',
      bottom: (100 - position.y) + '%',
    }"
  >
    <span class="text-4xl filter drop-shadow-lg">{{ config.icon }}</span>
    <span
      v-if="senderName"
      class="text-xs font-medium mt-1 px-2 py-0.5 rounded-full"
      :style="{ backgroundColor: config.color + '33', color: config.color }"
    >
      {{ senderName }}
    </span>
  </div>
</template>
