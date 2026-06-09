<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const walletStore = useWalletStore();
const notificationStore = useNotificationStore();

const avatarUrl = computed(() => authStore.user?.avatar || '');
const displayName = computed(() => authStore.user?.display_name || authStore.user?.username || 'User');
const unreadBadge = computed(() => {
  const count = notificationStore.unreadCount;
  return count > 99 ? '99+' : count > 0 ? count.toString() : '';
});

const activeNav = computed(() => {
  const path = route.path;
  if (path === '/') return 'feed';
  if (path.startsWith('/live') || path.startsWith('/stream')) return 'live';
  if (path.startsWith('/wallet') || path.startsWith('/web3')) return 'wallet';
  if (path.startsWith('/dm')) return 'dm';
  if (path.startsWith('/marketplace')) return 'marketplace';
  if (path.startsWith('/subscriptions')) return 'subscriptions';
  return '';
});

const navItems = [
  { label: 'Feed', value: 'feed', route: '/' },
  { label: 'Go Live', value: 'live', route: '/stream/go-live' },
  { label: 'Wallet', value: 'wallet', route: '/wallet' },
  { label: 'DMs', value: 'dm', route: '/dm' },
  { label: 'Market', value: 'marketplace', route: '/marketplace' },
  { label: 'Subs', value: 'subscriptions', route: '/subscriptions' },
];

function goToNotifications() {
  router.push('/notifications');
}

function goToWallet() {
  router.push('/wallet');
}

function goToProfile() {
  if (authStore.user) {
    router.push(`/profile/${authStore.user.id}`);
  } else {
    router.push('/auth/login');
  }
}

function goToLogin() {
  router.push('/auth/login');
}
</script>

<template>
  <v-app-bar
    density="compact"
    color="transparent"
    class="!bg-[rgba(18,18,18,0.95)] backdrop-blur-md border-b border-white/5"
    elevation="0"
  >
    <!-- Logo -->
    <template #prepend>
      <div class="flex items-center ml-3 cursor-pointer" @click="router.push('/')">
        <v-icon color="rogan-primary" size="26">mdi-broadcast</v-icon>
        <span class="text-lg font-bold ml-1.5 tracking-wide text-white">
          ROGAN <span class="text-rogan-primary">LIVE</span>
        </span>
      </div>
    </template>

    <!-- Desktop Navigation Links -->
    <div class="hidden md:flex items-center gap-0.5 ml-6">
      <v-btn
        v-for="item in navItems"
        :key="item.value"
        variant="text"
        size="small"
        :color="activeNav === item.value ? 'rogan-primary' : 'white'"
        :class="activeNav === item.value ? 'font-bold' : 'font-normal opacity-70'"
        class="text-xs tracking-wide px-3"
        @click="router.push(item.route)"
      >
        {{ item.label }}
      </v-btn>
    </div>

    <v-spacer />

    <!-- Search Bar (desktop only) -->
    <div class="hidden sm:flex items-center mr-3">
      <v-text-field
        density="compact"
        variant="solo-filled"
        placeholder="Search streams..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        flat
        class="max-w-[240px]"
        bg-color="#2D2D2D"
        rounded="lg"
      />
    </div>

    <!-- Right Side Actions -->
    <template #append>
      <div class="flex items-center gap-0.5 mr-2">
        <!-- Notifications Bell -->
        <v-btn icon variant="text" size="small" @click="goToNotifications">
          <v-badge
            :model-value="!!unreadBadge"
            :content="unreadBadge"
            color="rogan-primary"
            overlap
          >
            <v-icon color="white" size="20">mdi-bell-outline</v-icon>
          </v-badge>
        </v-btn>

        <!-- Wallet Balance (desktop) -->
        <v-btn
          variant="text"
          size="small"
          class="hidden md:flex items-center gap-1"
          @click="goToWallet"
        >
          <v-icon size="18" color="amber">mdi-diamond-stone</v-icon>
          <span class="text-white text-sm font-medium">
            {{ walletStore.tkBalance.toLocaleString() }}
          </span>
        </v-btn>

        <!-- User Avatar or Login -->
        <v-avatar
          v-if="authStore.user"
          size="30"
          class="cursor-pointer ml-1 ring-2 ring-rogan-primary/50"
          @click="goToProfile"
        >
          <v-img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
          />
          <v-icon v-else color="white" size="18">mdi-account</v-icon>
        </v-avatar>
        <v-btn
          v-else
          variant="outlined"
          size="small"
          color="rogan-primary"
          class="ml-1 text-xs"
          @click="goToLogin"
        >
          Login
        </v-btn>
      </div>
    </template>
  </v-app-bar>
</template>
