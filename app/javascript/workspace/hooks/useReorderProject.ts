import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderProject } from '../api/projects';
import type { Project, ReorderInput, ItemMove, ProjectItem, ProjectSection } from '../types';

export function useReorderProject(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderInput) => reorderProject(projectId, input),

    // Optimistic update for buttery smooth UX
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });

      // Snapshot previous state
      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);

      if (previousProject && input.item_moves) {
        // Apply optimistic update for item moves
        const updatedProject = applyItemMoves(previousProject, input.item_moves);
        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      if (previousProject && input.section_order) {
        // Apply optimistic update for section reorder
        const updatedProject = applySectionOrder(
          queryClient.getQueryData<Project>(['project', projectId]) || previousProject,
          input.section_order
        );
        queryClient.setQueryData(['project', projectId], updatedProject);
      }

      return { previousProject };
    },

    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
    },

    // Don't invalidate - we trust our optimistic update
    // Server response will sync if there's a discrepancy
  });
}

// Apply item moves to project data
function applyItemMoves(project: Project, moves: ItemMove[]): Project {
  // Create a map of all items from all sections
  const allItems = new Map<number, ProjectItem>();
  project.sections.forEach((section) => {
    section.items?.forEach((item) => {
      allItems.set(item.id, { ...item });
    });
  });

  // Build new sections with updated item positions
  const newSections: ProjectSection[] = project.sections.map((section) => {
    // Find items that should be in this section after moves
    const itemsInSection: ProjectItem[] = [];

    // Get items currently in this section that aren't being moved
    section.items?.forEach((item) => {
      const move = moves.find((m) => m.item_id === item.id);
      if (!move || move.section_id === section.id) {
        // Item stays in this section
        itemsInSection.push({ ...item });
      }
    });

    // Add items being moved to this section
    moves.forEach((move) => {
      if (move.section_id === section.id) {
        const item = allItems.get(move.item_id);
        if (item) {
          // Check if item is already in the list
          const existingIndex = itemsInSection.findIndex((i) => i.id === move.item_id);
          if (existingIndex === -1) {
            itemsInSection.push({ ...item, position: move.position });
          } else {
            itemsInSection[existingIndex] = { ...itemsInSection[existingIndex], position: move.position };
          }
        }
      }
    });

    // Update positions from moves
    moves.forEach((move) => {
      if (move.section_id === section.id) {
        const item = itemsInSection.find((i) => i.id === move.item_id);
        if (item) {
          item.position = move.position;
        }
      }
    });

    // Sort items by position
    itemsInSection.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    return {
      ...section,
      items: itemsInSection,
    };
  });

  return {
    ...project,
    sections: newSections,
  };
}

// Apply section order to project data
function applySectionOrder(project: Project, sectionOrder: number[]): Project {
  const sectionsMap = new Map(project.sections.map((s) => [s.id, s]));

  const orderedSections = sectionOrder
    .map((id, index) => {
      const section = sectionsMap.get(id);
      if (section) {
        return { ...section, position: index };
      }
      return null;
    })
    .filter((s): s is ProjectSection => s !== null);

  return {
    ...project,
    sections: orderedSections,
  };
}
