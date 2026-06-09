<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const isAuthRoute = computed(() => route.path.startsWith('/auth'));
const isLiveRoom = computed(() => route.path.startsWith('/live/'));
const showNav = computed(() => !isAuthRoute.value);

const activeTab = computed(() => {
  const path = route.path;
  if (path === '/' || path.startsWith('/live')) return 'feed';
  if (path.startsWith('/stream') || path.startsWith('/dashboard')) return 'live';
  if (path.startsWith('/wallet') || path.startsWith('/web3')) return 'wallet';
  if (path.startsWith('/dm')) return 'dm';
  if (path.startsWith('/profile') && authStore.user && route.params.id === authStore.user.id) return 'profile';
  return 'feed';
});

const unreadBadge = computed(() => {
  const count = notificationStore.unreadCount;
  return count > 99 ? '99+' : count > 0 ? count.toString() : '';
});

const bottomNavItems = [
  { label: 'Feed', icon: 'mdi-home', activeIcon: 'mdi-home', value: 'feed', route: '/' },
  { label: 'Live', icon: 'mdi-broadcast', activeIcon: 'mdi-broadcast', value: 'live', route: '/stream/go-live' },
  { label: 'Wallet', icon: 'mdi-wallet-outline', activeIcon: 'mdi-wallet', value: 'wallet', route: '/wallet' },
  { label: 'DMs', icon: 'mdi-message-outline', activeIcon: 'mdi-message', value: 'dm', route: '/dm' },
  { label: 'Profile', icon: 'mdi-account-outline', activeIcon: 'mdi-account', value: 'profile', route: authStore.user ? `/profile/${authStore.user.id}` : '/auth/login' },
];

function goToNotifications() {
  router.push('/notifications');
}
</script>

<template>
  <div class="flex flex-col h-screen bg-[#121212]">
    <!-- ── Mobile Top Bar ─────────────────────────────────────────── -->
    <header
      v-if="showNav"
      class="h-12 flex items-center px-3 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 flex-shrink-0 z-20"
    >
      <!-- Logo -->
      <div class="flex items-center cursor-pointer" @click="router.push('/')">
        <v-icon color="#E91E63" size="24">mdi-broadcast</v-icon>
        <span class="text-base font-bold ml-1.5 tracking-wide text-white">
          ROGAN <span class="text-rogan-primary">LIVE</span>
        </span>
      </div>

      <v-spacer />

      <!-- Notifications -->
      <button class="relative p-1.5 mr-1" @click="goToNotifications">
        <v-icon size="22" color="rgba(255,255,255,0.7)">mdi-bell-outline</v-icon>
        <span
          v-if="unreadBadge"
          class="absolute -top-0.5 -right-0.5 bg-rogan-primary text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5"
        >
          {{ unreadBadge }}
        </span>
      </button>

      <!-- User Avatar / Login -->
      <v-avatar
        v-if="authStore.user"
        size="28"
        class="cursor-pointer ring-2 ring-rogan-primary/40"
        @click="router.push(`/profile/${authStore.user.id}`)"
      >
        <v-img v-if="authStore.user.avatar" :src="authStore.user.avatar" />
        <v-icon v-else size="16" color="white">mdi-account</v-icon>
      </v-avatar>
      <v-btn
        v-else
        variant="outlined"
        size="x-small"
        color="rogan-primary"
        class="text-[10px]"
        @click="router.push('/auth/login')"
      >
        Login
      </v-btn>
    </header>

    <!-- ── Page Content ──────────────────────────────────────────── -->
    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>

    <!-- ── Bottom Navigation ─────────────────────────────────────── -->
    <v-bottom-navigation
      v-if="showNav"
      :model-value="activeTab"
      color="rogan-primary"
      bg-color="#0A0A0A"
      class="border-t border-white/5"
      grow
    >
      <v-btn
        v-for="item in bottomNavItems"
        :key="item.value"
        :value="item.value"
        @click="router.push(item.route)"
      >
        <v-icon>{{ activeTab === item.value ? item.activeIcon : item.icon }}</v-icon>
        <span class="text-[10px] mt-1">{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>
