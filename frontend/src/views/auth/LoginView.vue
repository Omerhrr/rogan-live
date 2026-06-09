<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});
const showPassword = ref(false);
const loading = ref(false);
const errorMsg = ref('');
const valid = ref(false);

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email',
];

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
];

async function handleLogin(): Promise<void> {
  if (!valid.value) return;
  loading.value = true;
  errorMsg.value = '';

  try {
    await authStore.login(form.email, form.password);
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (err: any) {
    errorMsg.value = err.response?.data?.detail || 'Invalid email or password. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function handleGoogleLogin(): Promise<void> {
  // In production, this would use Google OAuth SDK
  errorMsg.value = 'Google OAuth requires server configuration. Use email login for now.';
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#121212] px-4">
    <v-card
      class="w-full max-w-md bg-[#1E1E1E] rounded-2xl"
      elevation="8"
    >
      <div class="pt-8 pb-4 px-8 text-center">
        <v-icon color="rogan-primary" size="48">mdi-broadcast</v-icon>
        <h1 class="text-2xl font-bold mt-3 text-white">
          Welcome to <span class="text-rogan-primary">Rogan Live</span>
        </h1>
        <p class="text-gray-400 mt-1 text-sm">Sign in to watch and interact with live streams</p>
      </div>

      <v-card-text class="px-8 pb-2">
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="errorMsg = ''"
        >
          {{ errorMsg }}
        </v-alert>

        <v-form v-model="valid" @submit.prevent="handleLogin">
          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            :rules="emailRules"
            variant="solo-filled"
            bg-color="#2D2D2D"
            class="mb-2"
          />

          <v-text-field
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passwordRules"
            variant="solo-filled"
            bg-color="#2D2D2D"
            class="mb-4"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-btn
            type="submit"
            block
            size="large"
            color="rogan-primary"
            :loading="loading"
            rounded="lg"
            class="font-semibold"
          >
            Sign In
          </v-btn>
        </v-form>

        <div class="flex items-center my-5">
          <v-divider class="flex-1" color="#3D3D3D" />
          <span class="px-4 text-xs text-gray-500 uppercase">or</span>
          <v-divider class="flex-1" color="#3D3D3D" />
        </div>

        <v-btn
          block
          size="large"
          variant="outlined"
          color="#3D3D3D"
          rounded="lg"
          @click="handleGoogleLogin"
        >
          <v-icon start>mdi-google</v-icon>
          Continue with Google
        </v-btn>
      </v-card-text>

      <v-card-actions class="justify-center pb-6">
        <span class="text-gray-400 text-sm">
          Don't have an account?
          <router-link
            to="/auth/register"
            class="text-rogan-primary font-medium hover:underline"
          >
            Sign Up
          </router-link>
        </span>
      </v-card-actions>
    </v-card>
  </div>
</template>
