<script setup lang="ts">
import { computed } from 'vue';
import type { Stream } from '@/types';
import { useChatStore } from '@/stores/chat';

const props = defineProps<{
  stream: Stream;
}>();

const chatStore = useChatStore();
const recentMessages = computed(() => chatStore.messages.slice(-3));
const viewerCount = computed(() => {
  if (chatStore.viewerCount > 0) return chatStore.viewerCount;
  return props.stream.viewer_count;
});
</script>

<template>
  <div class="absolute inset-0 z-10 pointer-events-none">
    <!-- Top: Creator info -->
    <div class="absolute top-4 left-4 right-16 flex items-center gap-3 pointer-events-auto">
      <v-avatar size="40" class="border-2 border-rogan-primary">
        <v-img
          v-if="stream.creator.avatar"
          :src="stream.creator.avatar"
          :alt="stream.creator.display_name"
        />
        <v-icon v-else size="24">mdi-account</v-icon>
      </v-avatar>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-white font-semibold text-sm truncate">
            {{ stream.creator.display_name }}
          </span>
          <v-icon v-if="stream.creator.role === 'creator'" size="14" color="rogan-primary">
            mdi-star
          </v-icon>
        </div>
        <div class="flex items-center gap-2 text-xs text-white/70">
          <span class="flex items-center gap-0.5">
            <v-icon size="12">mdi-eye</v-icon>
            {{ viewerCount.toLocaleString() }}
          </span>
          <span v-if="stream.category" class="text-rogan-accent">
            #{{ stream.category }}
          </span>
        </div>
      </div>
    </div>

    <!-- Stream title (optional, shown briefly) -->
    <div class="absolute top-16 left-4 right-20">
      <p v-if="stream.title" class="text-white/90 text-xs line-clamp-1">
        {{ stream.title }}
      </p>
    </div>

    <!-- Bottom: Chat preview -->
    <div class="absolute bottom-6 left-4 right-20 pointer-events-auto">
      <div class="flex flex-col gap-1">
        <transition-group name="chat-slide">
          <div
            v-for="msg in recentMessages"
            :key="msg.id"
            class="chat-message px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm max-w-[85%]"
            :class="{ 'gift-message': msg.is_gift }"
          >
            <span class="text-rogan-accent text-xs font-semibold mr-1">
              {{ msg.username }}
            </span>
            <span class="text-white text-xs">
              <span v-if="msg.is_gift" class="mr-1">{{ msg.gift_type === 'rose' ? '🌹' : msg.gift_type === 'heart' ? '❤️' : msg.gift_type === 'diamond' ? '💎' : msg.gift_type === 'rocket' ? '🚀' : '👑' }}</span>
              {{ msg.message }}
            </span>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-slide-enter-active {
  animation: slide-up 0.2s ease-out;
}
.chat-slide-leave-active {
  transition: opacity 0.15s;
}
.chat-slide-leave-to {
  opacity: 0;
}
</style>
