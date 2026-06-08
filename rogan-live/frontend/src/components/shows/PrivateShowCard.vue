<script setup lang="ts">
import { computed } from 'vue';
import type { PrivateShow } from '@/types';

const props = defineProps<{
  show: PrivateShow;
}>();

const emit = defineEmits<{
  (e: 'join', showId: string): void;
}>();

const remainingMinutes = computed(() => {
  if (!props.show.ends_at) return props.show.duration_minutes;
  const diff = new Date(props.show.ends_at).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 60000));
});

function formatViewers(): string {
  return `${props.show.current_viewers}/${props.show.max_viewers}`;
}
</script>

<template>
  <v-card class="bg-[#1E1E1E] rounded-xl overflow-hidden" @click="emit('join', show.id)">
    <!-- Thumbnail with overlay -->
    <div class="relative aspect-video bg-[#2D2D2D]">
      <v-img
        v-if="show.creator.avatar"
        :src="show.creator.avatar"
        cover
        class="w-full h-full opacity-50"
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <v-icon size="48" color="rogan-secondary">mdi-lock-outline</v-icon>
      </div>

      <!-- Live indicator -->
      <div class="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded">
        <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <span class="text-white text-[10px] font-bold">LIVE</span>
      </div>

      <!-- Duration -->
      <div class="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded">
        <span class="text-white text-[10px]">{{ remainingMinutes }}m left</span>
      </div>

      <!-- Price badge -->
      <div class="absolute bottom-2 right-2 bg-amber-600 px-2 py-0.5 rounded">
        <span class="text-white text-[11px] font-bold">{{ show.price_tk }} TK</span>
      </div>
    </div>

    <div class="p-3">
      <div class="flex items-center gap-2 mb-2">
        <v-avatar size="28">
          <v-img v-if="show.creator.avatar" :src="show.creator.avatar" />
          <v-icon v-else size="18">mdi-account</v-icon>
        </v-avatar>
        <span class="text-white text-sm font-medium truncate">{{ show.creator.display_name }}</span>
        <v-icon v-if="show.creator.role === 'creator'" size="12" color="rogan-primary">mdi-star</v-icon>
      </div>

      <p class="text-gray-400 text-xs truncate mb-2">{{ show.title }}</p>

      <div class="flex items-center justify-between">
        <span class="text-gray-500 text-xs flex items-center gap-1">
          <v-icon size="12">mdi-eye</v-icon>
          {{ formatViewers() }} viewers
        </span>

        <v-btn size="x-small" color="rogan-primary" rounded="lg" variant="flat">
          Join
        </v-btn>
      </div>
    </div>
  </v-card>
</template>
