<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import type { OAuthProvider } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const error = ref('');
const loading = ref(true);

onMounted(async () => {
  const provider = route.params.provider as OAuthProvider;
  const code = route.query.code as string;
  const state = route.query.state as string;
  const errorParam = route.query.error as string;

  if (errorParam) {
    error.value = route.query.error_description as string || 'OAuth authentication failed';
    loading.value = false;
    return;
  }

  if (!code) {
    error.value = 'No authorization code received';
    loading.value = false;
    return;
  }

  try {
    const { data } = await api.post('/auth/oauth/callback', {
      provider,
      code,
      state,
    });

    // Store auth data
    localStorage.setItem('rogan_token', data.token);
    localStorage.setItem('rogan_user', JSON.stringify(data.user));

    // Update auth store
    await authStore.fetchUser();

    // Redirect to feed or original destination
    const redirect = (route.query.redirect as string) || '/';
    router.replace(redirect);
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Authentication failed. Please try again.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#121212] flex items-center justify-center">
    <!-- Loading -->
    <div v-if="loading" class="text-center">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
      <p class="text-gray-400 text-sm mt-4">Authenticating...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center max-w-md mx-auto px-4">
      <v-icon size="64" color="red">mdi-alert-circle</v-icon>
      <h2 class="text-xl font-bold text-white mt-4">Authentication Failed</h2>
      <p class="text-gray-400 text-sm mt-2">{{ error }}</p>
      <v-btn color="rogan-primary" rounded="lg" class="mt-4" @click="router.push('/auth/login')">
        Back to Login
      </v-btn>
    </div>
  </div>
</template>
