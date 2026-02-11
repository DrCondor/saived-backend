import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSectionGroup, updateSectionGroup, deleteSectionGroup, restoreSectionGroup } from '../api/sectionGroups';
import { useOptionalUndoRedo } from '../contexts/UndoRedoContext';
import type { CreateSectionGroupInput, UpdateSectionGroupInput, Project } from '../types';

export function useCreateSectionGroup(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (input: CreateSectionGroupInput = {}) =>
      createSectionGroup(projectId, input),
    onSuccess: (createdGroup) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      pushUndo({
        description: `dodanie grupy '${createdGroup.name}'`,
        undo: async () => {
          await deleteSectionGroup(projectId, createdGroup.id);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        redo: async () => {
          await createSectionGroup(projectId, { name: createdGroup.name });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
      });
    },
  });
}

export function useUpdateSectionGroup(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

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
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);
      const previousProjects = queryClient.getQueryData<Array<{ id: number; section_groups: Array<{ id: number; name: string; position: number }> }>>(['projects']);

      // Capture previous values for undo
      let previousValues: Partial<UpdateSectionGroupInput> | null = null;
      if (previousProject) {
        const group = previousProject.section_groups.find((g) => g.id === groupId);
        if (group) {
          previousValues = {};
          if (input.name !== undefined) previousValues.name = group.name;
          if (input.position !== undefined) previousValues.position = group.position;
        }

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

      // Also update the projects list (used by sidebar)
      if (previousProjects) {
        queryClient.setQueryData(
          ['projects'],
          previousProjects.map((project) => {
            if (project.id !== projectId) return project;
            return {
              ...project,
              section_groups: project.section_groups.map((group) => {
                if (group.id !== groupId) return group;
                return {
                  ...group,
                  ...(input.name !== undefined && { name: input.name }),
                  ...(input.position !== undefined && { position: input.position }),
                };
              }),
            };
          })
        );
      }

      // Push undo entry for name edits
      if (previousValues && input.name !== undefined) {
        pushUndo({
          description: `zmianę nazwy grupy`,
          undo: async () => {
            await updateSectionGroup(projectId, groupId, previousValues as UpdateSectionGroupInput);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          },
          redo: async () => {
            await updateSectionGroup(projectId, groupId, input);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          },
        });
      }

      return { previousProject, previousProjects };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
  });
}

export function useDeleteSectionGroup(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (groupId: number) => deleteSectionGroup(projectId, groupId),

    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      let deletedGroupName = '';
      if (previousProject) {
        const group = previousProject.section_groups.find((g) => g.id === groupId);
        if (group) deletedGroupName = group.name;

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

      return { previousProject, deletedGroupName };
    },

    onError: (_err, _groupId, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    onSuccess: (_data, groupId, context) => {
      pushUndo({
        description: `usunięcie grupy '${context?.deletedGroupName ?? ''}'`,
        undo: async () => {
          await restoreSectionGroup(projectId, groupId);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        redo: async () => {
          await deleteSectionGroup(projectId, groupId);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
