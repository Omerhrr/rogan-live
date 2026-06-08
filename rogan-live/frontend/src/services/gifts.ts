import api from './api';
import type { Gift, GiftType, CreatorGiftStats } from '@/types';

export async function sendGift(
  streamId: string,
  giftType: GiftType,
  message: string = ''
): Promise<Gift> {
  const { data } = await api.post<Gift>('/gifts/send', {
    stream_id: streamId,
    gift_type: giftType,
    message,
  });
  return data;
}

export async function getStreamGifts(
  streamId: string
): Promise<Gift[]> {
  const { data } = await api.get<Gift[]>(`/gifts/stream/${streamId}`);
  return data;
}

export async function getCreatorStats(
  creatorId: string
): Promise<CreatorGiftStats[]> {
  const { data } = await api.get<CreatorGiftStats[]>(
    `/gifts/stats/${creatorId}`
  );
  return data;
}
