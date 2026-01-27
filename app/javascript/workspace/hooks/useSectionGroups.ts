import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSectionGroup, updateSectionGroup, deleteSectionGroup } from '../api/sectionGroups';
import type { CreateSectionGroupInput, UpdateSectionGroupInput, Project } from '../types';

export function useCreateSectionGroup(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSectionGroupInput = {}) =>
      createSectionGroup(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateSectionGroup(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      input,
    }: {
      groupId: number;
      input: UpdateSectionGroupInput;
    }) => updateSectionGroup(projectId, groupId, input),

    onMutate: async ({ groupId, input }) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      if (previousProject) {
        const updatedProject = {
          ...previousProject,
          section_groups: previousProject.section_groups.map((group) => {
            if (group.id !== groupId) return group;
            return {
              ...group,
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
  });
}

export function useDeleteSectionGroup(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => deleteSectionGroup(projectId, groupId),

    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      if (previousProject) {
        const updatedProject = {
          ...previousProject,
          section_groups: previousProject.section_groups.filter((g) => g.id !== groupId),
          sections: previousProject.sections.filter((s) => s.section_group_id !== groupId),
        };

        updatedProject.total_price = updatedProject.sections.reduce(
          (sum, section) => sum + (section.total_price || 0),
          0
        );

        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      return { previousProject };
    },

    onError: (_err, _groupId, context) => {
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
