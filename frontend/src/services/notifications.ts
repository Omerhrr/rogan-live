import api from './api';
import type { Notification, PaginatedResponse } from '@/types';

export async function getNotifications(
  page: number = 1
): Promise<{ notifications: Notification[]; total: number; page: number; limit: number; pages: number }> {
  const { data } = await api.get(
    '/notifications/',
    { params: { page, limit: 20 } }
  );
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count');
  return data.unread_count;
}

export async function markRead(notificationId: string): Promise<void> {
  await api.post(`/notifications/${notificationId}/read`);
}
