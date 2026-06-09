<script setup lang="ts">
import { computed } from 'vue';
import type { PKBattle } from '@/types';

const props = defineProps<{
  battle: PKBattle;
}>();

const emit = defineEmits<{
  (e: 'click', battleId: string): void;
}>();

const statusColor = computed(() => {
  const colors: Record<string, string> = {
    pending: 'gray',
    live: 'red',
    completed: 'green',
    cancelled: 'gray',
  };
  return colors[props.battle.status] || 'gray';
});

const totalScore = computed(() => props.battle.score_a + props.battle.score_b || 1);
const percentA = computed(() => Math.round((props.battle.score_a / totalScore.value) * 100));
</script>

<template>
  <v-card
    class="bg-[#1E1E1E] rounded-xl overflow-hidden cursor-pointer hover:bg-[#252525] transition-colors"
    @click="emit('click', battle.id)"
  >
    <div class="p-4">
      <!-- Status + Timer -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-1.5">
          <div
            class="w-2 h-2 rounded-full"
            :class="battle.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'"
          />
          <span class="text-xs font-bold uppercase" :class="battle.status === 'live' ? 'text-red-400' : 'text-gray-500'">
            {{ battle.status }}
          </span>
        </div>
        <span class="text-gray-500 text-xs">{{ battle.duration_minutes }}min</span>
      </div>

      <!-- VS Layout -->
      <div class="flex items-center gap-3 mb-3">
        <!-- Creator A -->
        <div class="flex-1 text-center">
          <v-avatar size="40">
            <v-img v-if="battle.creator_a.avatar" :src="battle.creator_a.avatar" />
            <v-icon v-else size="24">mdi-account</v-icon>
          </v-avatar>
          <p class="text-white text-xs font-medium mt-1 truncate">{{ battle.creator_a.display_name }}</p>
          <p class="text-cyan-400 text-sm font-bold">{{ battle.score_a.toLocaleString() }}</p>
        </div>

        <!-- VS -->
        <div class="text-center px-2">
          <span class="text-rogan-primary text-lg font-black">VS</span>
        </div>

        <!-- Creator B -->
        <div class="flex-1 text-center">
          <v-avatar size="40">
            <v-img v-if="battle.creator_b.avatar" :src="battle.creator_b.avatar" />
            <v-icon v-else size="24">mdi-account</v-icon>
          </v-avatar>
          <p class="text-white text-xs font-medium mt-1 truncate">{{ battle.creator_b.display_name }}</p>
          <p class="text-amber-400 text-sm font-bold">{{ battle.score_b.toLocaleString() }}</p>
        </div>
      </div>

      <!-- Score Bar -->
      <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
        <div
          class="h-full bg-cyan-400 transition-all duration-500"
          :style="{ width: `${percentA}%` }"
        />
        <div
          class="h-full bg-amber-400 transition-all duration-500"
          :style="{ width: `${100 - percentA}%` }"
        />
      </div>
    </div>
  </v-card>
</template>
