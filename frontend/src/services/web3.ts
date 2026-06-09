import api from './api';
import type { SIWEResponse, Web3Transaction, WalletInfo } from '@/types';

export async function getSIWENonce(): Promise<{ message: string; nonce: string }> {
  const { data } = await api.get<{ message: string; nonce: string }>('/web3/siwe/nonce');
  return data;
}

export async function signInWithEthereum(
  message: string,
  signature: string
): Promise<SIWEResponse> {
  const { data } = await api.post<SIWEResponse>('/web3/siwe/verify', {
    message,
    signature,
  });
  return data;
}

export async function connectWallet(address: string): Promise<WalletInfo> {
  const { data } = await api.post<WalletInfo>('/web3/connect', { address });
  return data;
}

export async function disconnectWallet(): Promise<void> {
  await api.post('/web3/disconnect');
}

export async function depositRoganToTK(
  amount: number
): Promise<{ tx_hash: string; amount_tk: number }> {
  const { data } = await api.post<{ tx_hash: string; amount_tk: number }>('/web3/deposit', {
    amount,
  });
  return data;
}

export async function withdrawTKToRogan(
  tkAmount: number
): Promise<{ tx_hash: string; amount_rogan: number; fee: number }> {
  const { data } = await api.post<{
    tx_hash: string;
    amount_rogan: number;
    fee: number;
  }>('/web3/withdraw', { tk_amount: tkAmount });
  return data;
}

export async function getWeb3Transactions(
  page: number = 1,
  limit: number = 20
): Promise<{ items: Web3Transaction[]; total: number; pages: number }> {
  const { data } = await api.get<{
    items: Web3Transaction[];
    total: number;
    pages: number;
  }>('/web3/transactions', { params: { page, limit } });
  return data;
}

export async function getWalletInfo(): Promise<WalletInfo> {
  const { data } = await api.get<WalletInfo>('/web3/wallet');
  return data;
}
