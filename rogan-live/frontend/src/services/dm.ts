import api from './api';
import type { DirectMessage, Conversation, DMConversation, DMMessage, PaginatedResponse } from '@/types';

export async function sendDM(
  receiverId: string,
  content: string,
  isPaid: boolean = false,
  price: number = 0
): Promise<DirectMessage> {
  const { data } = await api.post<DirectMessage>('/dm/send', {
    receiver_id: receiverId,
    content,
    is_paid: isPaid,
    price,
  });
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>('/dm/conversations');
  return data;
}

export async function getConversation(id: string): Promise<DMConversation> {
  const { data } = await api.get<DMConversation>(`/dm/conversations/${id}`);
  return data;
}

export async function getMessages(
  partnerId: string,
  page: number = 1,
  limit: number = 30
): Promise<PaginatedResponse<DirectMessage>> {
  const { data } = await api.get<PaginatedResponse<DirectMessage>>(
    `/dm/messages/${partnerId}`,
    { params: { page, limit } }
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  isPaid: boolean = false
): Promise<DMMessage> {
  const { data } = await api.post<DMMessage>(
    `/dm/conversations/${conversationId}/messages`,
    { content, is_paid: isPaid }
  );
  return data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  await api.post(`/dm/conversations/${conversationId}/read`);
}

export async function setDMPrice(conversationId: string, price: number): Promise<void> {
  await api.put('/dm/price', { conversation_id: conversationId, price });
}

export async function markRead(messageId: string): Promise<void> {
  await api.post(`/dm/read/${messageId}`);
}
