<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { useNotificationStore } from '@/stores/notifications';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();
const notificationStore = useNotificationStore();

const sidebarCollapsed = ref(false);

const isAuthRoute = computed(() => route.path.startsWith('/auth'));
const isLiveRoom = computed(() => route.path.startsWith('/live/'));
const isFeedRoute = computed(() => route.path === '/');

// Hide sidebar on full-immersive views (live room keeps its own nav)
const showSidebar = computed(() => !isAuthRoute.value);

const activeSection = computed(() => {
  const path = route.path;
  if (path === '/') return 'feed';
  if (path.startsWith('/live') || path.startsWith('/stream')) return 'live';
  if (path.startsWith('/wallet') || path.startsWith('/web3')) return 'wallet';
  if (path.startsWith('/dm')) return 'dm';
  if (path.startsWith('/marketplace')) return 'marketplace';
  if (path.startsWith('/subscriptions')) return 'subs';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/notifications')) return 'notifications';
  if (path.startsWith('/shows')) return 'shows';
  if (path.startsWith('/tasks')) return 'tasks';
  if (path.startsWith('/pk')) return 'pk';
  if (path.startsWith('/moderation')) return 'moderation';
  return '';
});

const unreadBadge = computed(() => {
  const count = notificationStore.unreadCount;
  return count > 99 ? '99+' : count > 0 ? count.toString() : '';
});

const sidebarItems = computed(() => {
  const items = [
    { icon: 'mdi-home', activeIcon: 'mdi-home', label: 'Feed', value: 'feed', route: '/' },
    { icon: 'mdi-broadcast', activeIcon: 'mdi-broadcast', label: 'Go Live', value: 'live', route: '/stream/go-live' },
    { icon: 'mdi-wallet-outline', activeIcon: 'mdi-wallet', label: 'Wallet', value: 'wallet', route: '/wallet' },
    { icon: 'mdi-message-outline', activeIcon: 'mdi-message', label: 'Messages', value: 'dm', route: '/dm' },
    { icon: 'mdi-store-outline', activeIcon: 'mdi-store', label: 'Market', value: 'marketplace', route: '/marketplace' },
    { icon: 'mdi-star-outline', activeIcon: 'mdi-star', label: 'Subs', value: 'subs', route: '/subscriptions' },
  ];

  if (authStore.isCreator) {
    items.push({ icon: 'mdi-chart-box-outline', activeIcon: 'mdi-chart-box', label: 'Dashboard', value: 'dashboard', route: '/dashboard' });
  }

  if (authStore.user?.role === 'admin') {
    items.push({ icon: 'mdi-shield-outline', activeIcon: 'mdi-shield', label: 'Moderation', value: 'moderation', route: '/moderation' });
  }

  return items;
});

const avatarUrl = computed(() => authStore.user?.avatar || '');
const displayName = computed(() => authStore.user?.display_name || authStore.user?.username || 'User');
</script>

<template>
  <div class="flex h-screen bg-[#121212] overflow-hidden">
    <!-- ── Sidebar ──────────────────────────────────────────────── -->
    <aside
      v-if="showSidebar"
      class="flex flex-col bg-[#0A0A0A] border-r border-white/5 transition-all duration-200 flex-shrink-0"
      :class="sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'"
    >
      <!-- Logo -->
      <div
        class="flex items-center h-16 px-4 cursor-pointer border-b border-white/5"
        @click="router.push('/')"
      >
        <v-icon color="#E91E63" size="28">mdi-broadcast</v-icon>
        <transition name="fade">
          <span v-if="!sidebarCollapsed" class="ml-2.5 text-lg font-bold tracking-wide text-white whitespace-nowrap">
            ROGAN <span class="text-rogan-primary">LIVE</span>
          </span>
        </transition>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <button
          v-for="item in sidebarItems"
          :key="item.value"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
          :class="[
            activeSection === item.value
              ? 'bg-rogan-primary/15 text-rogan-primary'
              : 'text-white/60 hover:bg-white/5 hover:text-white/90'
          ]"
          @click="router.push(item.route)"
        >
          <v-icon
            size="22"
            :color="activeSection === item.value ? '#E91E63' : 'rgba(255,255,255,0.6)'"
          >
            {{ activeSection === item.value ? item.activeIcon : item.icon }}
          </v-icon>
          <transition name="fade">
            <span
              v-if="!sidebarCollapsed"
              class="text-sm font-medium whitespace-nowrap"
              :class="activeSection === item.value ? 'text-rogan-primary' : ''"
            >
              {{ item.label }}
            </span>
          </transition>
        </button>
      </nav>

      <!-- Bottom Section -->
      <div class="border-t border-white/5 p-3 space-y-2">
        <!-- Collapse Toggle -->
        <button
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <v-icon size="20">
            {{ sidebarCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
          </v-icon>
          <transition name="fade">
            <span v-if="!sidebarCollapsed" class="text-xs">Collapse</span>
          </transition>
        </button>

        <!-- User / Login -->
        <div v-if="authStore.user" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors" @click="router.push(`/profile/${authStore.user.id}`)">
          <v-avatar size="32" class="ring-2 ring-rogan-primary/40 flex-shrink-0">
            <v-img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
            <v-icon v-else size="18" color="white">mdi-account</v-icon>
          </v-avatar>
          <transition name="fade">
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ displayName }}</p>
              <p class="text-amber-400 text-xs flex items-center gap-1">
                <v-icon size="12" color="amber">mdi-diamond-stone</v-icon>
                {{ walletStore.tkBalance.toLocaleString() }} TK
              </p>
            </div>
          </transition>
        </div>
        <button
          v-else
          class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rogan-primary text-white text-sm font-semibold hover:bg-rogan-primary/80 transition-colors"
          @click="router.push('/auth/login')"
        >
          <v-icon size="18">mdi-login</v-icon>
          <transition name="fade">
            <span v-if="!sidebarCollapsed">Sign In</span>
          </transition>
        </button>
      </div>
    </aside>

    <!-- ── Main Area ────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Bar (non-auth, non-feed routes) -->
      <header
        v-if="showSidebar && !isFeedRoute"
        class="h-14 flex items-center px-6 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 flex-shrink-0"
      >
        <!-- Search (center) -->
        <div class="flex-1 max-w-md mx-auto">
          <v-text-field
            density="compact"
            variant="solo-filled"
            placeholder="Search streams, creators..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            flat
            bg-color="#1E1E1E"
            rounded="lg"
          />
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-3 ml-4">
          <!-- Notifications -->
          <button class="relative p-2 rounded-lg hover:bg-white/5 transition-colors" @click="router.push('/notifications')">
            <v-icon size="20" color="rgba(255,255,255,0.7)">mdi-bell-outline</v-icon>
            <span
              v-if="unreadBadge"
              class="absolute -top-0.5 -right-0.5 bg-rogan-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {{ unreadBadge }}
            </span>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
