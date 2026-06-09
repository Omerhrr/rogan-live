<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/common/AppHeader.vue';
import AppBottomNav from '@/components/common/AppBottomNav.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const isAuthRoute = computed(() => route.path.startsWith('/auth'));
const showNav = computed(() => !isAuthRoute.value);
</script>

<template>
  <v-app class="bg-[#121212]">
    <AppHeader v-if="showNav" />

    <v-main class="bg-[#121212]">
      <router-view />
    </v-main>

    <AppBottomNav v-if="showNav" />

    <!-- Global Snackbar / Toast -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="showSnackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style scoped>
.v-main {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
