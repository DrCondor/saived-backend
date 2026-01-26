import { apiClient } from './client';
import type { FavoriteItem } from '../types';

export async function getFavorites(): Promise<FavoriteItem[]> {
  return apiClient<FavoriteItem[]>('/favorites');
}

export async function addFavorite(itemId: number): Promise<{ id: number; favorite: boolean }> {
  return apiClient<{ id: number; favorite: boolean }>(`/favorites/${itemId}`, {
    method: 'POST',
  });
}

export async function removeFavorite(itemId: number): Promise<{ id: number; favorite: boolean }> {
  return apiClient<{ id: number; favorite: boolean }>(`/favorites/${itemId}`, {
    method: 'DELETE',
  });
}
