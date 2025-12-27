import { apiClient } from './client';
import type { ProjectItem, CreateItemInput, UpdateItemInput } from '../types';

export async function createItem(
  sectionId: number,
  input: CreateItemInput
): Promise<ProjectItem> {
  return apiClient<ProjectItem>(`/project_sections/${sectionId}/items`, {
    method: 'POST',
    json: { product_item: input },
  });
}

export async function updateItem(
  sectionId: number,
  itemId: number,
  input: UpdateItemInput
): Promise<ProjectItem> {
  return apiClient<ProjectItem>(
    `/project_sections/${sectionId}/items/${itemId}`,
    {
      method: 'PATCH',
      json: { product_item: input },
    }
  );
}

export async function deleteItem(
  sectionId: number,
  itemId: number
): Promise<void> {
  await apiClient(`/project_sections/${sectionId}/items/${itemId}`, {
    method: 'DELETE',
  });
}
