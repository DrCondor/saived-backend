import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, updateItem, deleteItem, restoreItem } from '../api/items';
import { useOptionalUndoRedo } from '../contexts/UndoRedoContext';
import type { CreateItemInput, UpdateItemInput, Project, ProjectItem } from '../types';

export function useCreateItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(sectionId, input),
    onSuccess: (createdItem, input) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      pushUndo({
        description: `dodanie pozycji '${createdItem.name}'`,
        undo: async () => {
          await deleteItem(sectionId, createdItem.id);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        },
        redo: async () => {
          await createItem(sectionId, input);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        },
      });
    },
  });
}

export function useUpdateItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: number; input: UpdateItemInput }) =>
      updateItem(sectionId, itemId, input),

    // Optimistic update - runs BEFORE the mutation
    onMutate: async ({ itemId, input }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      // Capture previous item values for undo
      let previousItemValues: Partial<UpdateItemInput> | null = null;
      if (previousProject) {
        for (const section of previousProject.sections) {
          const item = section.items?.find((i) => i.id === itemId);
          if (item) {
            // Capture only the fields that are being changed
            previousItemValues = {};
            for (const key of Object.keys(input) as Array<keyof UpdateItemInput>) {
              (previousItemValues as Record<string, unknown>)[key] = (item as Record<string, unknown>)[key];
            }
            break;
          }
        }
      }

      // Optimistically update the cache
      if (previousProject) {
        const updatedProject = {
          ...previousProject,
          sections: previousProject.sections.map((section) => {
            if (section.id !== sectionId) return section;

            return {
              ...section,
              items: section.items?.map((item) => {
                if (item.id !== itemId) return item;

                // Merge the input with existing item
                const updatedItem: ProjectItem = { ...item };

                // Apply updates
                if (input.name !== undefined) updatedItem.name = input.name;
                if (input.note !== undefined) updatedItem.note = input.note || null;
                if (input.quantity !== undefined) updatedItem.quantity = input.quantity;
                if (input.unit_price !== undefined) {
                  updatedItem.unit_price = input.unit_price ?? null;
                  // Recalculate total price
                  if (updatedItem.unit_price !== null) {
                    updatedItem.total_price = updatedItem.unit_price * updatedItem.quantity;
                  }
                }
                if (input.currency !== undefined) updatedItem.currency = input.currency || 'PLN';
                if (input.category !== undefined) updatedItem.category = input.category || null;
                if (input.dimensions !== undefined) updatedItem.dimensions = input.dimensions || null;
                if (input.status !== undefined) updatedItem.status = input.status;
                if (input.external_url !== undefined) updatedItem.external_url = input.external_url || null;
                if (input.discount_label !== undefined) updatedItem.discount_label = input.discount_label || null;
                if (input.thumbnail_url !== undefined) updatedItem.thumbnail_url = input.thumbnail_url || null;

                // Recalculate total if quantity changed
                if (input.quantity !== undefined && updatedItem.unit_price !== null) {
                  updatedItem.total_price = updatedItem.unit_price * updatedItem.quantity;
                }

                return updatedItem;
              }),
            };
          }),
        };

        // Recalculate section totals
        updatedProject.sections = updatedProject.sections.map((section) => ({
          ...section,
          total_price: section.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0,
        }));

        // Recalculate project total
        updatedProject.total_price = updatedProject.sections.reduce(
          (sum, section) => sum + (section.total_price || 0),
          0
        );

        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      // Push undo entry
      if (previousItemValues) {
        pushUndo({
          description: `edycję pozycji`,
          undo: async () => {
            await updateItem(sectionId, itemId, previousItemValues as UpdateItemInput);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          },
          redo: async () => {
            await updateItem(sectionId, itemId, input);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          },
        });
      }

      // Return context with the previous value for rollback
      return { previousProject };
    },

    // If mutation fails, rollback to the previous value
    onError: (_err, _variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    // Merge API response to get server-calculated values (especially for discounts)
    onSuccess: (updatedItem, { itemId }) => {
      queryClient.setQueryData<Project>(['project', projectId], (oldProject) => {
        if (!oldProject) return oldProject;

        const updatedProject = {
          ...oldProject,
          sections: oldProject.sections.map((section) => {
            if (section.id !== sectionId) return section;

            return {
              ...section,
              items: section.items?.map((item) => {
                if (item.id !== itemId) return item;
                // Merge all fields from the API response
                return { ...item, ...updatedItem };
              }),
            };
          }),
        };

        // Recalculate section totals
        updatedProject.sections = updatedProject.sections.map((section) => ({
          ...section,
          total_price: section.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0,
        }));

        // Recalculate project total
        updatedProject.total_price = updatedProject.sections.reduce(
          (sum, section) => sum + (section.total_price || 0),
          0
        );

        return updatedProject;
      });
    },
  });
}

export function useDeleteItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (itemId: number) => deleteItem(sectionId, itemId),

    // Optimistic delete
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      // Capture item name for undo description
      let deletedItemName = '';
      if (previousProject) {
        for (const section of previousProject.sections) {
          const item = section.items?.find((i) => i.id === itemId);
          if (item) {
            deletedItemName = item.name;
            break;
          }
        }

        const updatedProject = {
          ...previousProject,
          sections: previousProject.sections.map((section) => {
            if (section.id !== sectionId) return section;

            return {
              ...section,
              items: section.items?.filter((item) => item.id !== itemId),
            };
          }),
        };

        // Recalculate totals
        updatedProject.sections = updatedProject.sections.map((section) => ({
          ...section,
          total_price: section.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0,
        }));

        updatedProject.total_price = updatedProject.sections.reduce(
          (sum, section) => sum + (section.total_price || 0),
          0
        );

        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      return { previousProject, deletedItemName };
    },

    onError: (_err, _itemId, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    onSuccess: (_data, itemId, context) => {
      pushUndo({
        description: `usunięcie pozycji '${context?.deletedItemName ?? ''}'`,
        undo: async () => {
          await restoreItem(sectionId, itemId);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        },
        redo: async () => {
          await deleteItem(sectionId, itemId);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        },
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}
