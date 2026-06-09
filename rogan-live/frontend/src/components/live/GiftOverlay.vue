<script setup lang="ts">
import { computed } from 'vue';
import type { GiftAnimation as GiftAnim } from '@/stores/chat';
import GiftAnimation from '@/components/common/GiftAnimation.vue';
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();
const animations = computed(() => chatStore.giftAnimations);

function removeAnimation(id: string): void {
  chatStore.giftAnimations = chatStore.giftAnimations.filter((a) => a.id !== id);
}
</script>

<template>
  <div class="absolute inset-0 pointer-events-none z-40 overflow-hidden">
    <GiftAnimation
      v-for="anim in animations"
      :key="anim.id"
      :gift-type="anim.giftType"
      :position="{ x: anim.x, y: anim.y }"
      :sender-name="anim.senderName"
      @done="removeAnimation(anim.id)"
    />
  </div>
</template>
