import api from './api';
import type { PKBattle, PKBattleGift, PaginatedResponse, GiftType } from '@/types';

export async function getBattles(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<PKBattle>> {
  const { data } = await api.get<PaginatedResponse<PKBattle>>('/pk/battles', {
    params: { page, limit },
  });
  return data;
}

export async function getBattle(battleId: string): Promise<PKBattle> {
  const { data } = await api.get<PKBattle>(`/pk/battles/${battleId}`);
  return data;
}

export async function createBattle(payload: {
  opponent_id: string;
  duration_minutes: number;
  entry_gift_type: GiftType;
  entry_gift_amount: number;
}): Promise<PKBattle> {
  const { data } = await api.post<PKBattle>('/pk/battles', payload);
  return data;
}

export async function startBattle(battleId: string): Promise<PKBattle> {
  const { data } = await api.post<PKBattle>(`/pk/battles/${battleId}/start`);
  return data;
}

export async function endBattle(battleId: string): Promise<PKBattle> {
  const { data } = await api.post<PKBattle>(`/pk/battles/${battleId}/end`);
  return data;
}

export async function sendBattleGift(
  battleId: string,
  targetCreatorId: string,
  giftType: GiftType,
  amount: number = 1
): Promise<PKBattleGift> {
  const { data } = await api.post<PKBattleGift>(`/pk/battles/${battleId}/gift`, {
    target_creator_id: targetCreatorId,
    gift_type: giftType,
    amount,
  });
  return data;
}

export async function getBattleGifts(battleId: string): Promise<PKBattleGift[]> {
  const { data } = await api.get<PKBattleGift[]>(`/pk/battles/${battleId}/gifts`);
  return data;
}

export async function acceptChallenge(battleId: string): Promise<PKBattle> {
  const { data } = await api.post<PKBattle>(`/pk/battles/${battleId}/accept`);
  return data;
}

export async function declineChallenge(battleId: string): Promise<PKBattle> {
  const { data } = await api.post<PKBattle>(`/pk/battles/${battleId}/decline`);
  return data;
}
