import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSection, updateSection, deleteSection } from '../api/sections';
import type { CreateSectionInput, UpdateSectionInput } from '../types';

export function useCreateSection(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSectionInput = {}) =>
      createSection(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateSection(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      input,
    }: {
      sectionId: number;
      input: UpdateSectionInput;
    }) => updateSection(projectId, sectionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteSection(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: number) => deleteSection(projectId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
