<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();
const notificationStore = useNotificationStore();

const avatarUrl = computed(() => authStore.user?.avatar || '');
const displayName = computed(() => authStore.user?.display_name || authStore.user?.username || 'User');
const unreadBadge = computed(() => {
  const count = notificationStore.unreadCount;
  return count > 99 ? '99+' : count > 0 ? count.toString() : '';
});

function goToNotifications() {
  router.push('/notifications');
}

function goToWallet() {
  router.push('/wallet');
}

function goToProfile() {
  if (authStore.user) {
    router.push(`/profile/${authStore.user.id}`);
  }
}
</script>

<template>
  <v-app-bar
    density="compact"
    color="transparent"
    class="!bg-[rgba(18,18,18,0.92)] backdrop-blur-md"
    elevation="0"
  >
    <template #prepend>
      <div class="flex items-center ml-2 cursor-pointer" @click="router.push('/')">
        <v-icon color="rogan-primary" size="28">mdi-broadcast</v-icon>
        <span class="text-lg font-bold ml-1 tracking-wider text-white">
          ROGAN <span class="text-rogan-primary">LIVE</span>
        </span>
      </div>
    </template>

    <v-spacer />

    <div class="hidden sm:flex items-center mr-2">
      <v-text-field
        density="compact"
        variant="solo-filled"
        placeholder="Search streams..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        flat
        class="max-w-[220px]"
        bg-color="#2D2D2D"
        rounded="lg"
      />
    </div>

    <template #append>
      <div class="flex items-center gap-1 mr-1">
        <!-- Notifications Bell -->
        <v-btn icon variant="text" @click="goToNotifications">
          <v-badge
            :model-value="!!unreadBadge"
            :content="unreadBadge"
            color="rogan-primary"
            overlap
          >
            <v-icon color="white">mdi-bell-outline</v-icon>
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

        <!-- User Avatar -->
        <v-avatar
          size="32"
          class="cursor-pointer ml-1 border-2 border-rogan-primary"
          @click="goToProfile"
        >
          <v-img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
          />
          <v-icon v-else color="white" size="20">mdi-account</v-icon>
        </v-avatar>
      </div>
    </template>
  </v-app-bar>
</template>
