import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import * as authService from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('rogan_token'));

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isCreator = computed(() => user.value?.role === 'creator' || user.value?.role === 'admin');

  async function login(email: string, password: string): Promise<void> {
    const res = await authService.login(email, password);
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('rogan_token', res.token);
    localStorage.setItem('rogan_user', JSON.stringify(res.user));
  }

  async function register(
    email: string,
    username: string,
    password: string
  ): Promise<void> {
    const res = await authService.register(email, username, password);
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('rogan_token', res.token);
    localStorage.setItem('rogan_user', JSON.stringify(res.user));
  }

  async function googleLogin(googleToken: string): Promise<void> {
    const res = await authService.googleAuth(googleToken);
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('rogan_token', res.token);
    localStorage.setItem('rogan_user', JSON.stringify(res.user));
  }

  async function fetchUser(): Promise<void> {
    try {
      const u = await authService.getMe();
      user.value = u;
      localStorage.setItem('rogan_user', JSON.stringify(u));
    } catch {
      logout();
    }
  }

  function logout(): void {
    user.value = null;
    token.value = null;
    localStorage.removeItem('rogan_token');
    localStorage.removeItem('rogan_user');
    authService.logout();
  }

  // Restore user from localStorage on init
  function init(): void {
    const savedUser = localStorage.getItem('rogan_user');
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        logout();
      }
    }
  }

  // Auto-initialize
  init();

  return {
    user,
    token,
    isAuthenticated,
    isCreator,
    login,
    register,
    googleLogin,
    fetchUser,
    logout,
  };
});
