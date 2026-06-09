<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useNotificationStore } from '@/stores/notifications';
import { useResponsive } from '@/composables/useResponsive';
import type { Notification, NotificationType } from '@/types';

const notificationStore = useNotificationStore();
const { isMobile } = useResponsive();

onMounted(() => {
  notificationStore.fetchNotifications();
  notificationStore.fetchUnreadCount();
});

const typeConfig: Record<NotificationType, { icon: string; color: string }> = {
  gift: { icon: 'mdi-gift', color: '#E91E63' },
  follow: { icon: 'mdi-account-plus', color: '#2196F3' },
  subscribe: { icon: 'mdi-star', color: '#9C27B0' },
  mention: { icon: 'mdi-at', color: '#FF9800' },
  live_start: { icon: 'mdi-broadcast', color: '#F44336' },
  system: { icon: 'mdi-information', color: '#607D8B' },
  payment: { icon: 'mdi-cash', color: '#4CAF50' },
};

function getConfig(type: NotificationType) {
  return typeConfig[type] || typeConfig.system;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

const groupedNotifications = computed(() => {
  const groups: Record<string, Notification[]> = {};
  for (const n of notificationStore.notifications) {
    const key = formatDate(n.created_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
});

async function handleMarkRead(id: string): Promise<void> {
  await notificationStore.markRead(id);
}

async function markAllRead(): Promise<void> {
  for (const n of notificationStore.notifications) {
    if (!n.is_read) {
      await notificationStore.markRead(n.id);
    }
  }
}
</script>

<template>
  <!-- Desktop Layout -->
  <div v-if="!isMobile" class="h-full overflow-y-auto">
    <div class="max-w-3xl mx-auto px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-white">Notifications</h1>
        <v-btn v-if="notificationStore.unreadCount > 0" variant="text" size="small" color="rogan-primary" @click="markAllRead">
          Mark all read
        </v-btn>
      </div>

      <div v-if="notificationStore.loading" class="text-center py-12">
        <v-progress-circular indeterminate color="rogan-primary" />
      </div>

      <div v-else-if="notificationStore.notifications.length === 0" class="text-center py-12">
        <v-icon size="56" color="#3D3D3D">mdi-bell-off-outline</v-icon>
        <p class="text-gray-500 mt-3">No notifications yet</p>
      </div>

      <div v-else class="space-y-6">
        <div v-for="(notifications, dateLabel) in groupedNotifications" :key="dateLabel">
          <h3 class="text-sm font-semibold text-gray-400 mb-3">{{ dateLabel }}</h3>
          <div class="space-y-2">
            <div v-for="notif in notifications" :key="notif.id"
              class="flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer"
              :class="notif.is_read ? 'bg-[#1E1E1E]' : 'bg-[#2D2D2D] border-l-2 border-rogan-primary'"
              @click="handleMarkRead(notif.id)"
            >
              <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :style="{ backgroundColor: getConfig(notif.type).color + '22' }"
              >
                <v-icon size="20" :color="getConfig(notif.type).color">{{ getConfig(notif.type).icon }}</v-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium">{{ notif.title }}</p>
                <p class="text-gray-400 text-xs mt-0.5 line-clamp-2">{{ notif.message }}</p>
                <span class="text-gray-500 text-[11px] mt-1 block">{{ formatTime(notif.created_at) }}</span>
              </div>
              <div v-if="!notif.is_read" class="w-2.5 h-2.5 rounded-full bg-rogan-primary flex-shrink-0 mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="min-h-screen bg-[#121212] max-w-2xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-white">Notifications</h1>
      <v-btn v-if="notificationStore.unreadCount > 0" variant="text" size="small" color="rogan-primary" @click="markAllRead">
        Mark all read
      </v-btn>
    </div>

    <div v-if="notificationStore.loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="notificationStore.notifications.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-bell-off-outline</v-icon>
      <p class="text-gray-500 mt-3">No notifications yet</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(notifications, dateLabel) in groupedNotifications" :key="dateLabel">
        <h3 class="text-sm font-semibold text-gray-400 mb-2">{{ dateLabel }}</h3>
        <div class="space-y-1">
          <div v-for="notif in notifications" :key="notif.id"
            class="flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer"
            :class="notif.is_read ? 'bg-[#1E1E1E]' : 'bg-[#2D2D2D] border-l-2 border-rogan-primary'"
            @click="handleMarkRead(notif.id)"
          >
            <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              :style="{ backgroundColor: getConfig(notif.type).color + '22' }"
            >
              <v-icon size="18" :color="getConfig(notif.type).color">{{ getConfig(notif.type).icon }}</v-icon>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium">{{ notif.title }}</p>
              <p class="text-gray-400 text-xs mt-0.5 line-clamp-2">{{ notif.message }}</p>
              <span class="text-gray-500 text-[10px] mt-1 block">{{ formatTime(notif.created_at) }}</span>
            </div>
            <div v-if="!notif.is_read" class="w-2 h-2 rounded-full bg-rogan-primary flex-shrink-0 mt-2" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
