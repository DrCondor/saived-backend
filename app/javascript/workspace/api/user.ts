import { apiClient } from './client';
import type { User, UpdateProfileInput, UpdatePasswordInput, CustomStatus, Discount } from '../types';

export async function fetchCurrentUser(): Promise<User> {
  return apiClient<User>('/me');
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  return apiClient<User>('/me', {
    method: 'PATCH',
    json: { user: input },
  });
}

export async function updatePassword(input: UpdatePasswordInput): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/me/password', {
    method: 'PATCH',
    json: input,
  });
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const response = await fetch('/api/v1/me/avatar', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': csrfToken || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0] || 'Upload failed');
  }

  return response.json();
}

export async function deleteAvatar(): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/me/avatar', {
    method: 'DELETE',
  });
}

export async function uploadCompanyLogo(file: File): Promise<{ company_logo_url: string }> {
  const formData = new FormData();
  formData.append('company_logo', file);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const response = await fetch('/api/v1/me/company_logo', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': csrfToken || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0] || 'Upload failed');
  }

  return response.json();
}

export async function deleteCompanyLogo(): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/me/company_logo', {
    method: 'DELETE',
  });
}

export async function updateCustomStatuses(
  customStatuses: CustomStatus[]
): Promise<{ custom_statuses: CustomStatus[] }> {
  return apiClient<{ custom_statuses: CustomStatus[] }>('/me/statuses', {
    method: 'PATCH',
    json: { custom_statuses: customStatuses },
  });
}

export async function updateDiscounts(
  discounts: Discount[]
): Promise<{ discounts: Discount[] }> {
  return apiClient<{ discounts: Discount[] }>('/me/discounts', {
    method: 'PATCH',
    json: { discounts },
  });
}

export async function dismissExtensionUpdate(version: number): Promise<void> {
  await apiClient<void>('/me/dismiss-extension-update', {
    method: 'PATCH',
    json: { version },
  });
}
