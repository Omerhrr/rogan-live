<script setup lang="ts">
import type { CreatorGiftStats, GiftType } from '@/types';

const props = defineProps<{
  stats: CreatorGiftStats[];
}>();

const giftIcons: Record<GiftType, string> = {
  rose: '🌹',
  heart: '❤️',
  diamond: '💎',
  rocket: '🚀',
  crown: '👑',
};

const giftColors: Record<GiftType, string> = {
  rose: '#E91E63',
  heart: '#FF4081',
  diamond: '#00BCD4',
  rocket: '#FF9800',
  crown: '#FFD700',
};
</script>

<template>
  <div class="bg-[#1E1E1E] rounded-2xl p-5">
    <h3 class="text-white font-semibold text-sm mb-4">Gift Breakdown</h3>

    <div v-if="stats.length === 0" class="text-center py-8">
      <p class="text-gray-500 text-sm">No gifts received yet</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="stat in stats"
        :key="stat.gift_type"
        class="flex items-center gap-3 p-3 rounded-xl bg-[#2D2D2D]"
      >
        <span class="text-2xl">{{ giftIcons[stat.gift_type] }}</span>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="text-white text-sm font-medium capitalize">
              {{ stat.gift_type }}
            </span>
            <span class="text-amber-400 text-sm font-semibold flex items-center gap-0.5">
              <v-icon size="14" color="amber">mdi-diamond-stone</v-icon>
              {{ stat.total_tk.toLocaleString() }}
            </span>
          </div>

          <div class="flex items-center gap-2 mt-1">
            <div class="flex-1 h-1.5 bg-[#3D3D3D] rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :style="{
                  backgroundColor: giftColors[stat.gift_type],
                  width: Math.min((stat.count / Math.max(...stats.map(s => s.count))) * 100, 100) + '%',
                }"
              />
            </div>
            <span class="text-xs text-gray-400">{{ stat.count }}x</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
