import api from './api';
import type { Notification, PaginatedResponse } from '@/types';

export async function getNotifications(
  page: number = 1
): Promise<PaginatedResponse<Notification>> {
  const { data } = await api.get<PaginatedResponse<Notification>>(
    '/notifications',
    { params: { page, limit: 20 } }
  );
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markRead(notificationId: string): Promise<void> {
  await api.post(`/notifications/${notificationId}/read`);
}
