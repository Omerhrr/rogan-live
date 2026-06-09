import api from './api';
import type { Wallet, Transaction, PaginatedResponse } from '@/types';

export async function getWallet(): Promise<Wallet> {
  const { data } = await api.get<Wallet>('/wallet');
  return data;
}

export async function linkWallet(address: string): Promise<Wallet> {
  const { data } = await api.post<Wallet>('/wallet/link', { wallet_address: address });
  return data;
}

export async function depositRogan(amount: number): Promise<Wallet> {
  const { data } = await api.post<Wallet>('/wallet/deposit', { amount });
  return data;
}

export async function withdrawRogan(tkAmount: number): Promise<Wallet> {
  const { data } = await api.post<Wallet>('/wallet/withdraw', {
    tk_amount: tkAmount,
  });
  return data;
}

export async function getTransactions(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await api.get<PaginatedResponse<Transaction>>(
    '/wallet/transactions',
    { params: { page, limit } }
  );
  return data;
}
