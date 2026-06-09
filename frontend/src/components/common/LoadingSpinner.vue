<script setup lang="ts">
withDefaults(defineProps<{
  size?: number;
  text?: string;
}>(), {
  size: 48,
  text: 'Loading...',
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div class="relative">
      <v-progress-circular
        :size="size"
        :width="3"
        color="rogan-primary"
        indeterminate
      />
      <v-icon
        size="20"
        color="rogan-primary"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        mdi-broadcast
      </v-icon>
    </div>
    <p class="mt-4 text-sm text-gray-400">{{ text }}</p>
  </div>
</template>
