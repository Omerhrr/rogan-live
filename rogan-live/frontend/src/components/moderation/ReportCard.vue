<script setup lang="ts">
import { computed } from 'vue';
import type { ModerationReport } from '@/types';

const props = defineProps<{
  report: ModerationReport;
}>();

const emit = defineEmits<{
  (e: 'resolve', reportId: string, action: 'dismiss' | 'warn' | 'strike' | 'ban'): void;
}>();

const reasonColors: Record<string, string> = {
  harassment: 'red',
  spam: 'orange',
  nudity: 'purple',
  violence: 'red',
  hate_speech: 'red',
  other: 'gray',
};

const statusColors: Record<string, string> = {
  pending: 'yellow',
  reviewing: 'blue',
  resolved: 'green',
  dismissed: 'gray',
};

const typeIcons: Record<string, string> = {
  stream: 'mdi-broadcast',
  message: 'mdi-message',
  user: 'mdi-account',
  product: 'mdi-store',
};
</script>

<template>
  <v-card class="bg-[#1E1E1E] rounded-xl p-4">
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-center gap-2">
        <v-icon size="18" :color="typeIcons[report.target_type] ? reasonColors[report.reason] : 'gray'">
          {{ typeIcons[report.target_type] || 'mdi-alert' }}
        </v-icon>
        <span class="text-white text-sm font-medium">{{ report.reason.replace('_', ' ') }}</span>
      </div>
      <v-chip
        size="x-small"
        :color="statusColors[report.status] || 'gray'"
        variant="flat"
      >
        {{ report.status }}
      </v-chip>
    </div>

    <p class="text-gray-400 text-xs mb-2">{{ report.description }}</p>

    <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
      <span class="flex items-center gap-1">
        <v-icon size="12">mdi-account</v-icon>
        Reporter: {{ report.reporter.display_name }}
      </span>
      <span class="flex items-center gap-1">
        <v-icon size="12">mdi-target</v-icon>
        Target: {{ report.target_user.display_name }}
      </span>
      <span class="flex items-center gap-1">
        <v-icon size="12">mdi-shape</v-icon>
        {{ report.target_type }}
      </span>
    </div>

    <div v-if="report.status === 'pending' || report.status === 'reviewing'" class="flex gap-2">
      <v-btn size="x-small" color="gray" variant="outlined" rounded="lg" @click="emit('resolve', report.id, 'dismiss')">
        Dismiss
      </v-btn>
      <v-btn size="x-small" color="yellow" variant="outlined" rounded="lg" @click="emit('resolve', report.id, 'warn')">
        Warn
      </v-btn>
      <v-btn size="x-small" color="orange" variant="outlined" rounded="lg" @click="emit('resolve', report.id, 'strike')">
        Strike
      </v-btn>
      <v-btn size="x-small" color="red" variant="flat" rounded="lg" @click="emit('resolve', report.id, 'ban')">
        Ban
      </v-btn>
    </div>

    <p class="text-gray-600 text-[10px] mt-2">
      {{ new Date(report.created_at).toLocaleString() }}
    </p>
  </v-card>
</template>
