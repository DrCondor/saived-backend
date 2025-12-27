import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSection, updateSection, deleteSection } from '../api/sections';
import type { CreateSectionInput, UpdateSectionInput, Project } from '../types';

export function useCreateSection(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSectionInput = {}) =>
      createSection(projectId, input),
    onSuccess: () => {
      // For create, we need to refetch to get the new section with ID
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

    // Optimistic update
    onMutate: async ({ sectionId, input }) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      if (previousProject) {
        const updatedProject = {
          ...previousProject,
          sections: previousProject.sections.map((section) => {
            if (section.id !== sectionId) return section;

            return {
              ...section,
              ...(input.name !== undefined && { name: input.name }),
              ...(input.position !== undefined && { position: input.position }),
            };
          }),
        };

        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      return { previousProject };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    // No need to invalidate - optimistic update is enough
  });
}

export function useDeleteSection(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: number) => deleteSection(projectId, sectionId),

    // Optimistic delete
    onMutate: async (sectionId) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      if (previousProject) {
        const updatedProject = {
          ...previousProject,
          sections: previousProject.sections.filter((section) => section.id !== sectionId),
        };

        // Recalculate project total
        updatedProject.total_price = updatedProject.sections.reduce(
          (sum, section) => sum + (section.total_price || 0),
          0
        );

        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      return { previousProject };
    },

    onError: (_err, _sectionId, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
