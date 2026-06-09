<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
});
const showPassword = ref(false);
const loading = ref(false);
const errorMsg = ref('');
const valid = ref(false);
const googleClientId = ref('');
const googleReady = ref(false);

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email',
];

const usernameRules = [
  (v: string) => !!v || 'Username is required',
  (v: string) => v.length >= 3 || 'Username must be at least 3 characters',
  (v: string) => /^[a-zA-Z0-9_]+$/.test(v) || 'Only letters, numbers, and underscores',
];

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
];

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === form.password || 'Passwords do not match',
];

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/google-client-id');
    googleClientId.value = data.client_id || '';
    if (googleClientId.value) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => { googleReady.value = true; };
      document.head.appendChild(script);
    }
  } catch {
    // Google OAuth not configured
  }
});

async function handleRegister(): Promise<void> {
  if (!valid.value) return;
  loading.value = true;
  errorMsg.value = '';

  try {
    await authStore.register(form.email, form.username, form.password);
    router.push('/');
  } catch (err: any) {
    errorMsg.value = err.response?.data?.detail || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}

function handleGoogleRegister(): void {
  if (!googleClientId.value || !googleReady.value) {
    errorMsg.value = 'Google Sign-In is not configured. Use email registration for now.';
    return;
  }

  try {
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: googleClientId.value,
      callback: async (response: any) => {
        if (!response.credential) {
          errorMsg.value = 'Google Sign-Up was cancelled.';
          return;
        }
        loading.value = true;
        errorMsg.value = '';
        try {
          await authStore.googleLogin(response.credential);
          router.push('/');
        } catch (err: any) {
          errorMsg.value = err.response?.data?.detail || 'Google Sign-Up failed.';
        } finally {
          loading.value = false;
        }
      },
    });
    // @ts-ignore
    google.accounts.id.prompt();
  } catch {
    errorMsg.value = 'Google Sign-In failed to initialize. Use email registration.';
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#121212] px-4 py-8">
    <v-card
      class="w-full max-w-md bg-[#1E1E1E] rounded-2xl"
      elevation="8"
    >
      <div class="pt-8 pb-4 px-8 text-center">
        <v-icon color="rogan-primary" size="48">mdi-broadcast</v-icon>
        <h1 class="text-2xl font-bold mt-3 text-white">
          Join <span class="text-rogan-primary">Rogan Live</span>
        </h1>
        <p class="text-gray-400 mt-1 text-sm">Create an account to start streaming and sending gifts</p>
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

        <v-form v-model="valid" @submit.prevent="handleRegister">
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
            v-model="form.username"
            label="Username"
            prepend-inner-icon="mdi-account-outline"
            :rules="usernameRules"
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
            class="mb-2"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-text-field
            v-model="form.confirmPassword"
            label="Confirm Password"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-check-outline"
            :rules="confirmPasswordRules"
            variant="solo-filled"
            bg-color="#2D2D2D"
            class="mb-4"
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
            Create Account
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
          :loading="loading"
          @click="handleGoogleRegister"
        >
          <v-icon start>mdi-google</v-icon>
          Sign up with Google
        </v-btn>
      </v-card-text>

      <v-card-actions class="justify-center pb-6">
        <span class="text-gray-400 text-sm">
          Already have an account?
          <router-link
            to="/auth/login"
            class="text-rogan-primary font-medium hover:underline"
          >
            Sign In
          </router-link>
        </span>
      </v-card-actions>
    </v-card>
  </div>
</template>
