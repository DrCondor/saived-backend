import { apiClient, apiClientFormData } from './client';
import type { ProjectItem, CreateItemInput, UpdateItemInput } from '../types';

// Helper to build FormData from item input
function buildItemFormData(input: CreateItemInput | UpdateItemInput): FormData {
  const formData = new FormData();

  // Add all non-file fields
  Object.entries(input).forEach(([key, value]) => {
    if (key === 'attachment') {
      // Handle file separately
      if (value instanceof File) {
        formData.append(`product_item[attachment]`, value);
      }
    } else if (value !== undefined && value !== null) {
      formData.append(`product_item[${key}]`, String(value));
    }
  });

  return formData;
}

export async function createItem(
  sectionId: number,
  input: CreateItemInput
): Promise<ProjectItem> {
  // Use FormData if there's an attachment, otherwise use JSON
  if (input.attachment) {
    const formData = buildItemFormData(input);
    return apiClientFormData<ProjectItem>(
      `/project_sections/${sectionId}/items`,
      formData,
      'POST'
    );
  }

  // Strip attachment from input for JSON request
  const { attachment, ...jsonInput } = input;
  return apiClient<ProjectItem>(`/project_sections/${sectionId}/items`, {
    method: 'POST',
    json: { product_item: jsonInput },
  });
}

export async function updateItem(
  sectionId: number,
  itemId: number,
  input: UpdateItemInput
): Promise<ProjectItem> {
  // Use FormData if there's an attachment, otherwise use JSON
  if (input.attachment) {
    const formData = buildItemFormData(input);
    return apiClientFormData<ProjectItem>(
      `/project_sections/${sectionId}/items/${itemId}`,
      formData,
      'PATCH'
    );
  }

  // Strip attachment from input for JSON request
  const { attachment, ...jsonInput } = input;
  return apiClient<ProjectItem>(
    `/project_sections/${sectionId}/items/${itemId}`,
    {
      method: 'PATCH',
      json: { product_item: jsonInput },
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
