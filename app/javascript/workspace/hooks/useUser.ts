import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCurrentUser,
  updateProfile,
  updatePassword,
  uploadAvatar,
  deleteAvatar,
  uploadCompanyLogo,
  deleteCompanyLogo,
  updateCustomStatuses,
  dismissExtensionUpdate,
} from '../api/user';
import type { User, UpdateProfileInput, UpdatePasswordInput, CustomStatus } from '../types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    // Initialize with data from window if available
    initialData: () => {
      const initialData = (window as any).__INITIAL_DATA__?.currentUser;
      if (initialData) {
        // Transform from Rails naming to our interface
        return {
          ...initialData,
          api_token: initialData.apiToken || initialData.api_token,
        } as User;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: UpdatePasswordInput) => updatePassword(input),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      // Update the user's avatar_url in the cache
      queryClient.setQueryData<User | undefined>(['currentUser'], (old) => {
        if (!old) return old;
        return { ...old, avatar_url: data.avatar_url };
      });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => {
      queryClient.setQueryData<User | undefined>(['currentUser'], (old) => {
        if (!old) return old;
        return { ...old, avatar_url: null };
      });
    },
  });
}

export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(file),
    onSuccess: (data) => {
      // Add cache-busting timestamp to prevent browser caching
      const urlWithCacheBust = data.company_logo_url
        ? `${data.company_logo_url}${data.company_logo_url.includes('?') ? '&' : '?'}t=${Date.now()}`
        : null;
      queryClient.setQueryData<User | undefined>(['currentUser'], (old) => {
        if (!old) return old;
        return { ...old, company_logo_url: urlWithCacheBust };
      });
    },
  });
}

export function useDeleteCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteCompanyLogo(),
    onSuccess: () => {
      queryClient.setQueryData<User | undefined>(['currentUser'], (old) => {
        if (!old) return old;
        return { ...old, company_logo_url: null };
      });
    },
  });
}

export function useUpdateCustomStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statuses: CustomStatus[]) => updateCustomStatuses(statuses),
    onSuccess: (data) => {
      queryClient.setQueryData<User | undefined>(['currentUser'], (old) => {
        if (!old) return old;
        return { ...old, custom_statuses: data.custom_statuses };
      });
      // Invalidate projects to recalculate totals
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useDismissExtensionUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => dismissExtensionUpdate(version),
    onSuccess: (_, version) => {
      queryClient.setQueryData<User | undefined>(['currentUser'], (old) => {
        if (!old) return old;
        return { ...old, seen_extension_version: version };
      });
    },
  });
}
