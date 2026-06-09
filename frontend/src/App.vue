<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useResponsive } from '@/composables/useResponsive';
import DesktopLayout from '@/layouts/DesktopLayout.vue';
import MobileLayout from '@/layouts/MobileLayout.vue';

const route = useRoute();
const { layoutMode } = useResponsive();

const isAuthRoute = computed(() => route.path.startsWith('/auth'));
</script>

<template>
  <v-app class="bg-[#121212]">
    <!-- Auth pages: no layout wrapper -->
    <template v-if="isAuthRoute">
      <v-main class="bg-[#121212]">
        <router-view />
      </v-main>
    </template>

    <!-- App pages: device-specific layout -->
    <template v-else>
      <DesktopLayout v-if="layoutMode === 'desktop'" />
      <MobileLayout v-else />
    </template>

    <!-- Global Snackbar -->
    <v-snackbar
      :model-value="false"
      :timeout="3000"
      location="top"
    />
  </v-app>
</template>
