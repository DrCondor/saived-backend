import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSection, updateSection, deleteSection, restoreSection } from '../api/sections';
import { useOptionalUndoRedo } from '../contexts/UndoRedoContext';
import type { CreateSectionInput, UpdateSectionInput, Project } from '../types';

export function useCreateSection(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (input: CreateSectionInput = {}) =>
      createSection(projectId, input),
    onSuccess: (createdSection) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      pushUndo({
        description: `dodanie sekcji '${createdSection.name}'`,
        undo: async () => {
          await deleteSection(projectId, createdSection.id);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        redo: async () => {
          await createSection(projectId, { name: createdSection.name });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
      });
    },
  });
}

export function useUpdateSection(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

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
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);
      const previousProjects = queryClient.getQueryData<Array<{ id: number; sections: Array<{ id: number; name: string; position: number; section_group_id: number | null }> }>>(['projects']);

      // Capture previous values for undo
      let previousValues: Partial<UpdateSectionInput> | null = null;
      if (previousProject) {
        const section = previousProject.sections.find((s) => s.id === sectionId);
        if (section) {
          previousValues = {};
          if (input.name !== undefined) previousValues.name = section.name;
          if (input.position !== undefined) previousValues.position = section.position;
        }

        const updatedProject = {
          ...previousProject,
          sections: previousProject.sections.map((s) => {
            if (s.id !== sectionId) return s;

            return {
              ...s,
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
              sections: project.sections.map((section) => {
                if (section.id !== sectionId) return section;
                return {
                  ...section,
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
          description: `zmianę nazwy sekcji`,
          undo: async () => {
            await updateSection(projectId, sectionId, previousValues as UpdateSectionInput);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          },
          redo: async () => {
            await updateSection(projectId, sectionId, input);
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

    // No need to invalidate - optimistic update is enough
  });
}

export function useDeleteSection(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (sectionId: number) => deleteSection(projectId, sectionId),

    // Optimistic delete
    onMutate: async (sectionId) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      let deletedSectionName = '';
      if (previousProject) {
        const section = previousProject.sections.find((s) => s.id === sectionId);
        if (section) deletedSectionName = section.name;

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

      return { previousProject, deletedSectionName };
    },

    onError: (_err, _sectionId, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    onSuccess: (_data, sectionId, context) => {
      pushUndo({
        description: `usunięcie sekcji '${context?.deletedSectionName ?? ''}'`,
        undo: async () => {
          await restoreSection(projectId, sectionId);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        redo: async () => {
          await deleteSection(projectId, sectionId);
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
