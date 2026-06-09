<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeTab = computed(() => {
  const path = route.path;
  if (path === '/') return 'feed';
  if (path.startsWith('/live')) return 'feed';
  if (path.startsWith('/stream') || path.startsWith('/dashboard')) return 'live';
  if (path.startsWith('/wallet') || path.startsWith('/web3')) return 'wallet';
  if (path.startsWith('/dm')) return 'dm';
  if (path.startsWith('/profile') && authStore.user && route.params.id === authStore.user.id) return 'profile';
  return 'feed';
});

const items = [
  { label: 'Feed', icon: 'mdi-home', activeIcon: 'mdi-home', value: 'feed', route: '/' },
  { label: 'Live', icon: 'mdi-broadcast', activeIcon: 'mdi-broadcast', value: 'live', route: '/stream/go-live' },
  { label: 'Wallet', icon: 'mdi-wallet-outline', activeIcon: 'mdi-wallet', value: 'wallet', route: '/wallet' },
  { label: 'DMs', icon: 'mdi-message-outline', activeIcon: 'mdi-message', value: 'dm', route: '/dm' },
  { label: 'Profile', icon: 'mdi-account-outline', activeIcon: 'mdi-account', value: 'profile', route: authStore.user ? `/profile/${authStore.user.id}` : '/auth/login' },
];
</script>

<template>
  <v-bottom-navigation
    :model-value="activeTab"
    color="rogan-primary"
    bg-color="#1E1E1E"
    class="sm:hidden"
    grow
  >
    <v-btn
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      @click="router.push(item.route)"
    >
      <v-icon>{{ activeTab === item.value ? item.activeIcon : item.icon }}</v-icon>
      <span class="text-[10px] mt-1">{{ item.label }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>
