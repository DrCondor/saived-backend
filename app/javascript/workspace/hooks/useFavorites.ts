import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites';
import type { Project, FavoriteItem } from '../types';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, favorite }: { itemId: number; favorite: boolean }) => {
      if (favorite) {
        return removeFavorite(itemId);
      } else {
        return addFavorite(itemId);
      }
    },
    // Optimistic update - change UI immediately
    onMutate: async ({ itemId, favorite }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project'] });
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot current values for rollback
      const previousProjects = queryClient.getQueriesData<Project>({ queryKey: ['project'] });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(['favorites']);

      // Optimistically update project cache
      queryClient.setQueriesData<Project>({ queryKey: ['project'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          sections: old.sections.map((section) => ({
            ...section,
            items: section.items?.map((item) =>
              item.id === itemId ? { ...item, favorite: !favorite } : item
            ),
          })),
        };
      });

      // Optimistically update favorites list (remove if unfavoriting)
      if (favorite && previousFavorites) {
        queryClient.setQueryData<FavoriteItem[]>(
          ['favorites'],
          previousFavorites.filter((item) => item.id !== itemId)
        );
      }

      return { previousProjects, previousFavorites };
    },
    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    // Always refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
