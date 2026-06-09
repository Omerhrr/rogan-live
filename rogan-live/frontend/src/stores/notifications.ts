import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Notification } from '@/types';
import * as notificationService from '@/services/notifications';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  async function fetchNotifications(): Promise<void> {
    loading.value = true;
    try {
      const res = await notificationService.getNotifications();
      notifications.value = res.notifications ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount(): Promise<void> {
    try {
      unreadCount.value = await notificationService.getUnreadCount();
    } catch {
      // Silently fail
    }
  }

  async function markRead(notificationId: string): Promise<void> {
    await notificationService.markRead(notificationId);
    const n = notifications.value.find((n) => n.id === notificationId);
    if (n) {
      n.is_read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  function addNotification(notification: Notification): void {
    notifications.value.unshift(notification);
    unreadCount.value++;
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    addNotification,
  };
});
