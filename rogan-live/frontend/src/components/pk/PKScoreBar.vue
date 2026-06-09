<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  scoreA: number;
  scoreB: number;
  labelA?: string;
  labelB?: string;
}>();

const totalScore = computed(() => props.scoreA + props.scoreB || 1);
const percentA = computed(() => Math.round((props.scoreA / totalScore.value) * 100));
const percentB = computed(() => 100 - percentA.value);
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-1 text-xs">
      <span class="text-cyan-400 font-bold">{{ labelA || 'A' }}: {{ scoreA.toLocaleString() }}</span>
      <span class="text-amber-400 font-bold">{{ labelB || 'B' }}: {{ scoreB.toLocaleString() }}</span>
    </div>

    <div class="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
      <div
        class="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 ease-out"
        :style="{ width: `${percentA}%` }"
      />
      <div
        class="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
        :style="{ width: `${percentB}%` }"
      />
    </div>

    <div class="flex items-center justify-between mt-1 text-[10px] text-gray-500">
      <span>{{ percentA }}%</span>
      <span>{{ percentB }}%</span>
    </div>
  </div>
</template>
