import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, updateItem, deleteItem } from '../api/items';
import type { CreateItemInput, UpdateItemInput, Project, ProjectItem } from '../types';

export function useCreateItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(sectionId, input),
    onSuccess: () => {
      // For create, we need to refetch to get the new item with ID
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateItem(projectId: number, sectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: number; input: UpdateItemInput }) =>
      updateItem(sectionId, itemId, input),

    // Optimistic update - runs BEFORE the mutation
    onMutate: async ({ itemId, input }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

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

  return useMutation({
    mutationFn: (itemId: number) => deleteItem(sectionId, itemId),

    // Optimistic delete
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      if (previousProject) {
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

      return { previousProject };
    },

    onError: (_err, _itemId, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}
