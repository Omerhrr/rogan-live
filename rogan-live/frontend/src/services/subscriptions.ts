import api from './api';
import type { SubscriptionTier, Subscription, PaginatedResponse } from '@/types';

export async function getCreatorTiers(creatorId: string): Promise<SubscriptionTier[]> {
  const { data } = await api.get<SubscriptionTier[]>(`/subscriptions/creators/${creatorId}/tiers`);
  return data;
}

export async function createTier(payload: {
  name: string;
  price_tk: number;
  perks: string[];
  max_subscribers?: number;
  color?: string;
}): Promise<SubscriptionTier> {
  const { data } = await api.post<SubscriptionTier>('/subscriptions/tiers', payload);
  return data;
}

export async function updateTier(
  tierId: string,
  payload: Partial<SubscriptionTier>
): Promise<SubscriptionTier> {
  const { data } = await api.put<SubscriptionTier>(`/subscriptions/tiers/${tierId}`, payload);
  return data;
}

export async function deleteTier(tierId: string): Promise<void> {
  await api.delete(`/subscriptions/tiers/${tierId}`);
}

export async function subscribe(tierId: string): Promise<Subscription> {
  const { data } = await api.post<Subscription>(`/subscriptions/tiers/${tierId}/subscribe`);
  return data;
}

export async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
  const { data } = await api.post<Subscription>(`/subscriptions/${subscriptionId}/cancel`);
  return data;
}

export async function getMySubscriptions(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Subscription>> {
  const { data } = await api.get<PaginatedResponse<Subscription>>('/subscriptions/my', {
    params: { page, limit },
  });
  return data;
}

export async function getCreatorSubscribers(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Subscription>> {
  const { data } = await api.get<PaginatedResponse<Subscription>>('/subscriptions/subscribers', {
    params: { page, limit },
  });
  return data;
}

export async function getSubscriptionRevenue(): Promise<{
  total_tk: number;
  monthly_tk: number;
  active_subscribers: number;
}> {
  const { data } = await api.get<{
    total_tk: number;
    monthly_tk: number;
    active_subscribers: number;
  }>('/subscriptions/revenue');
  return data;
}
