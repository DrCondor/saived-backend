import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, updateItem, deleteItem } from '../api/items';
import type { CreateItemInput, UpdateItemInput } from '../types';

export function useCreateItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(sectionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: number; input: UpdateItemInput }) =>
      updateItem(sectionId, itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => deleteItem(sectionId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}
