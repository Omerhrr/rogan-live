import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PKBattle, PKBattleGift, GiftType } from '@/types';
import * as pkService from '@/services/pk';

export const usePKStore = defineStore('pk', () => {
  const battles = ref<PKBattle[]>([]);
  const currentBattle = ref<PKBattle | null>(null);
  const battleGifts = ref<PKBattleGift[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const hasMore = ref(true);

  const liveBattles = computed(() => battles.value.filter((b) => b.status === 'live'));
  const pendingBattles = computed(() => battles.value.filter((b) => b.status === 'pending'));

  async function fetchBattles(append: boolean = false): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
      if (!append) page.value = 1;
      const res = await pkService.getBattles(page.value, 10);
      const items = res.streams ?? res.items ?? [];
      if (append) {
        battles.value.push(...items);
      } else {
        battles.value = items;
      }
      hasMore.value = page.value < res.pages;
      page.value++;
    } finally {
      loading.value = false;
    }
  }

  async function fetchBattle(battleId: string): Promise<void> {
    loading.value = true;
    try {
      currentBattle.value = await pkService.getBattle(battleId);
    } finally {
      loading.value = false;
    }
  }

  async function createBattle(payload: {
    opponent_id: string;
    duration_minutes: number;
    entry_gift_type: GiftType;
    entry_gift_amount: number;
  }): Promise<PKBattle> {
    const battle = await pkService.createBattle(payload);
    battles.value.unshift(battle);
    return battle;
  }

  async function startBattle(battleId: string): Promise<void> {
    const battle = await pkService.startBattle(battleId);
    if (currentBattle.value?.id === battleId) {
      currentBattle.value = battle;
    }
    const idx = battles.value.findIndex((b) => b.id === battleId);
    if (idx >= 0) battles.value[idx] = battle;
  }

  async function endBattle(battleId: string): Promise<void> {
    const battle = await pkService.endBattle(battleId);
    if (currentBattle.value?.id === battleId) {
      currentBattle.value = battle;
    }
    const idx = battles.value.findIndex((b) => b.id === battleId);
    if (idx >= 0) battles.value[idx] = battle;
  }

  async function sendBattleGift(
    battleId: string,
    targetCreatorId: string,
    giftType: GiftType,
    amount: number = 1
  ): Promise<void> {
    const gift = await pkService.sendBattleGift(battleId, targetCreatorId, giftType, amount);
    battleGifts.value.push(gift);
  }

  async function fetchBattleGifts(battleId: string): Promise<void> {
    battleGifts.value = await pkService.getBattleGifts(battleId);
  }

  async function acceptChallenge(battleId: string): Promise<void> {
    const battle = await pkService.acceptChallenge(battleId);
    if (currentBattle.value?.id === battleId) {
      currentBattle.value = battle;
    }
  }

  async function declineChallenge(battleId: string): Promise<void> {
    const battle = await pkService.declineChallenge(battleId);
    if (currentBattle.value?.id === battleId) {
      currentBattle.value = battle;
    }
  }

  function updateBattleScore(battleId: string, scoreA: number, scoreB: number): void {
    if (currentBattle.value?.id === battleId) {
      currentBattle.value.score_a = scoreA;
      currentBattle.value.score_b = scoreB;
    }
    const idx = battles.value.findIndex((b) => b.id === battleId);
    if (idx >= 0) {
      battles.value[idx].score_a = scoreA;
      battles.value[idx].score_b = scoreB;
    }
  }

  return {
    battles,
    currentBattle,
    battleGifts,
    loading,
    hasMore,
    liveBattles,
    pendingBattles,
    fetchBattles,
    fetchBattle,
    createBattle,
    startBattle,
    endBattle,
    sendBattleGift,
    fetchBattleGifts,
    acceptChallenge,
    declineChallenge,
    updateBattleScore,
  };
});
