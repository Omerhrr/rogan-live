import api from './api';
import type { MarketplaceProduct, ProductPurchase, ProductType, PaginatedResponse } from '@/types';

export async function getProducts(
  page: number = 1,
  limit: number = 12,
  productType?: ProductType,
  sort: string = 'newest',
  search?: string
): Promise<PaginatedResponse<MarketplaceProduct>> {
  const { data } = await api.get<PaginatedResponse<MarketplaceProduct>>('/marketplace/products', {
    params: { page, limit, product_type: productType, sort, search },
  });
  return data;
}

export async function getProduct(productId: string): Promise<MarketplaceProduct> {
  const { data } = await api.get<MarketplaceProduct>(`/marketplace/products/${productId}`);
  return data;
}

export async function createProduct(payload: {
  title: string;
  description: string;
  price_tk: number;
  product_type: ProductType;
  content_url?: string;
  thumbnail_url?: string;
  is_published?: boolean;
}): Promise<MarketplaceProduct> {
  const { data } = await api.post<MarketplaceProduct>('/marketplace/products', payload);
  return data;
}

export async function updateProduct(
  productId: string,
  payload: Partial<MarketplaceProduct>
): Promise<MarketplaceProduct> {
  const { data } = await api.put<MarketplaceProduct>(`/marketplace/products/${productId}`, payload);
  return data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await api.delete(`/marketplace/products/${productId}`);
}

export async function purchaseProduct(productId: string): Promise<ProductPurchase> {
  const { data } = await api.post<ProductPurchase>(`/marketplace/products/${productId}/purchase`);
  return data;
}

export async function getMyProducts(
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<MarketplaceProduct>> {
  const { data } = await api.get<PaginatedResponse<MarketplaceProduct>>('/marketplace/my-products', {
    params: { page, limit },
  });
  return data;
}

export async function getMyPurchases(
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<ProductPurchase>> {
  const { data } = await api.get<PaginatedResponse<ProductPurchase>>('/marketplace/purchases', {
    params: { page, limit },
  });
  return data;
}
