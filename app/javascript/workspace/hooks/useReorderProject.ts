import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { reorderProject } from '../api/projects';
import { useOptionalUndoRedo } from '../contexts/UndoRedoContext';
import type { Project, ProjectListItem, ReorderInput, ItemMove, SectionMove, ProjectItem, ProjectSection, SectionGroup } from '../types';

export function useReorderProject(projectId: number) {
  const queryClient = useQueryClient();
  const { pushUndo } = useOptionalUndoRedo();

  return useMutation({
    mutationFn: (input: ReorderInput) => reorderProject(projectId, input),

    // Optimistic update for buttery smooth UX
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot previous state
      const previousProject = queryClient.getQueryData<Project>(['project', projectId]);
      const previousProjects = queryClient.getQueryData<ProjectListItem[]>(['projects']);

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
        // Also update projects list for sidebar
        updateProjectsListSections(queryClient, projectId, updatedProject);
      }

      if (previousProject && input.group_order) {
        const current = queryClient.getQueryData<Project>(['project', projectId]) || previousProject;
        const updatedProject = applyGroupOrder(current, input.group_order);
        queryClient.setQueryData(['project', projectId], updatedProject);
        // Also update projects list for sidebar
        updateProjectsListGroups(queryClient, projectId, updatedProject);
      }

      if (previousProject && input.section_moves) {
        const current = queryClient.getQueryData<Project>(['project', projectId]) || previousProject;
        const updatedProject = applySectionMoves(current, input.section_moves);
        queryClient.setQueryData(['project', projectId], updatedProject);
        // Also update projects list for sidebar
        updateProjectsListSections(queryClient, projectId, updatedProject);
      }

      // Build reverse reorder input from previous state
      if (previousProject) {
        const reverseInput: ReorderInput = {};

        if (input.item_moves) {
          // Capture previous positions of moved items
          const reverseItemMoves: ItemMove[] = [];
          input.item_moves.forEach((move) => {
            for (const section of previousProject.sections) {
              const item = section.items?.find((i) => i.id === move.item_id);
              if (item) {
                reverseItemMoves.push({
                  item_id: move.item_id,
                  section_id: section.id,
                  position: item.position ?? 0,
                });
                break;
              }
            }
          });
          reverseInput.item_moves = reverseItemMoves;
        }

        if (input.section_order) {
          reverseInput.section_order = previousProject.sections.map((s) => s.id);
        }

        if (input.group_order) {
          reverseInput.group_order = previousProject.section_groups.map((g) => g.id);
        }

        if (input.section_moves) {
          const reverseSectionMoves: SectionMove[] = [];
          input.section_moves.forEach((move) => {
            const section = previousProject.sections.find((s) => s.id === move.section_id);
            if (section) {
              reverseSectionMoves.push({
                section_id: move.section_id,
                group_id: section.section_group_id,
                position: section.position,
              });
            }
          });
          reverseInput.section_moves = reverseSectionMoves;
        }

        pushUndo({
          description: `zmianę kolejności`,
          undo: async () => {
            await reorderProject(projectId, reverseInput);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          },
          redo: async () => {
            await reorderProject(projectId, input);
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          },
        });
      }

      return { previousProject, previousProjects };
    },

    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
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

// Apply group order to project data
function applyGroupOrder(project: Project, groupOrder: number[]): Project {
  const groupsMap = new Map(project.section_groups.map((g) => [g.id, g]));

  const orderedGroups = groupOrder
    .map((id, index) => {
      const group = groupsMap.get(id);
      if (group) {
        return { ...group, position: index };
      }
      return null;
    })
    .filter((g): g is SectionGroup => g !== null);

  return {
    ...project,
    section_groups: orderedGroups,
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

// Apply section moves to project data (moving sections between/out of groups)
function applySectionMoves(project: Project, moves: SectionMove[]): Project {
  const newSections = project.sections.map((section) => {
    const move = moves.find((m) => m.section_id === section.id);
    if (move) {
      return {
        ...section,
        section_group_id: move.group_id,
        position: move.position,
      };
    }
    return section;
  });

  // Sort by position
  newSections.sort((a, b) => a.position - b.position);

  return {
    ...project,
    sections: newSections,
  };
}

// Update projects list cache with new section data (for sidebar)
function updateProjectsListSections(
  queryClient: QueryClient,
  projectId: number,
  updatedProject: Project
) {
  queryClient.setQueryData<ProjectListItem[]>(['projects'], (oldProjects) => {
    if (!oldProjects) return oldProjects;
    return oldProjects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        sections: updatedProject.sections.map((s) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          section_group_id: s.section_group_id,
        })),
      };
    });
  });
}

// Update projects list cache with new group data (for sidebar)
function updateProjectsListGroups(
  queryClient: QueryClient,
  projectId: number,
  updatedProject: Project
) {
  queryClient.setQueryData<ProjectListItem[]>(['projects'], (oldProjects) => {
    if (!oldProjects) return oldProjects;
    return oldProjects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        section_groups: updatedProject.section_groups,
        sections: updatedProject.sections.map((s) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          section_group_id: s.section_group_id,
        })),
      };
    });
  });
}
