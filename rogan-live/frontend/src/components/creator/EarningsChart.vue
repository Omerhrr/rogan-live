<script setup lang="ts">
import { computed } from 'vue';
import type { DailyEarning } from '@/types';

const props = defineProps<{
  earnings: DailyEarning[];
}>();

const maxEarning = computed(() => {
  if (!props.earnings.length) return 1;
  return Math.max(...props.earnings.map((e) => e.tk_amount), 1);
});

function barHeight(amount: number): string {
  return Math.max((amount / maxEarning.value) * 100, 4) + '%';
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en', { weekday: 'short' });
}
</script>

<template>
  <div class="bg-[#1E1E1E] rounded-2xl p-5">
    <h3 class="text-white font-semibold text-sm mb-4">Earnings (Last 7 Days)</h3>

    <div v-if="earnings.length === 0" class="text-center py-8">
      <p class="text-gray-500 text-sm">No earnings data yet</p>
    </div>

    <div v-else class="flex items-end gap-2 h-40">
      <div
        v-for="(day, idx) in earnings"
        :key="idx"
        class="flex-1 flex flex-col items-center gap-1"
      >
        <span class="text-[10px] text-gray-400">
          {{ day.tk_amount > 0 ? day.tk_amount.toLocaleString() : '' }}
        </span>
        <div class="w-full relative" style="height: 120px">
          <div
            class="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
            :class="idx === earnings.length - 1 ? 'bg-rogan-primary' : 'bg-rogan-primary/40'"
            :style="{ height: barHeight(day.tk_amount) }"
          />
        </div>
        <span class="text-[10px] text-gray-500 mt-1">{{ formatDay(day.date) }}</span>
      </div>
    </div>
  </div>
</template>
