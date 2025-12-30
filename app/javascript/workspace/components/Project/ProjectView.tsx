import { useState, useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Project, ProjectItem, ProjectSection, ItemMove } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCreateSection } from '../../hooks/useSections';
import { useReorderProject } from '../../hooks/useReorderProject';
import Section from './Section';
import ItemCard from './ItemCard';

interface ProjectViewProps {
  project: Project;
}

// Custom collision detection that handles gaps between items
// Problem: space-y-3 creates gaps where pointerWithin detects section but not items
// Solution: Use closestCenter as fallback to find nearest item when in gap
const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  // Separate item collisions (numeric IDs) from section collisions (string IDs)
  const itemCollisions = pointerCollisions.filter(
    (collision) => typeof collision.id === 'number'
  );
  const sectionCollisions = pointerCollisions.filter(
    (collision) => typeof collision.id === 'string'
  );

  // If we're directly over an item, use it
  if (itemCollisions.length > 0) {
    return itemCollisions;
  }

  // If we're in a section but in the gap between items,
  // use closestCenter to find the nearest item
  if (sectionCollisions.length > 0) {
    const centerCollisions = closestCenter(args);
    const nearestItem = centerCollisions.find(
      (collision) => typeof collision.id === 'number'
    );
    if (nearestItem) {
      return [nearestItem];
    }
    // No items in section (empty section) - return section
    return sectionCollisions;
  }

  // Fallback to closestCenter for edge cases
  return closestCenter(args);
};

export default function ProjectView({ project }: ProjectViewProps) {
  const createSection = useCreateSection(project.id);
  const reorderProject = useReorderProject(project.id);

  // Local state for real-time DnD updates (enables cross-section animations)
  const [localSections, setLocalSections] = useState<ProjectSection[]>(project.sections || []);
  const [activeItem, setActiveItem] = useState<ProjectItem | null>(null);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  // Track the original section of the dragged item (for API call)
  const dragStartSectionRef = useRef<number | null>(null);

  // Sync local state with server data when project changes (and not dragging)
  useEffect(() => {
    if (!activeItemId) {
      setLocalSections(project.sections || []);
    }
  }, [project.sections, activeItemId]);

  // DnD sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleAddSection = () => {
    createSection.mutate({});
  };

  // Find which section an item belongs to (in local state)
  const findSectionByItemId = useCallback(
    (itemId: number, sections: ProjectSection[]) => {
      for (const section of sections) {
        if (section.items?.some((item) => item.id === itemId)) {
          return section;
        }
      }
      return null;
    },
    []
  );

  // Handle drag start - set the active item for the overlay
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const itemId = active.id as number;

      setActiveItemId(itemId);

      // Find the item being dragged and remember its original section
      for (const section of localSections) {
        const item = section.items?.find((i) => i.id === itemId);
        if (item) {
          setActiveItem(item);
          dragStartSectionRef.current = section.id;
          break;
        }
      }
    },
    [localSections]
  );

  // Handle drag over - move item between sections in real-time for smooth animations
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as number;
      const overId = over.id;

      // Find current section of the active item
      const activeSection = findSectionByItemId(activeId, localSections);
      if (!activeSection) return;

      // Determine target section
      let overSectionId: number | null = null;
      let overIndex: number | null = null;

      if (typeof overId === 'string' && overId.startsWith('section-')) {
        // Hovering over an empty section area
        overSectionId = parseInt(overId.replace('section-', ''), 10);
        overIndex = null; // Will append at end
      } else if (typeof overId === 'number') {
        // Hovering over another item
        const overSection = findSectionByItemId(overId, localSections);
        if (overSection) {
          overSectionId = overSection.id;
          overIndex = overSection.items?.findIndex((i) => i.id === overId) ?? 0;
        }
      }

      // If not over a valid target or same section, do nothing special
      if (!overSectionId || activeSection.id === overSectionId) return;

      // Move item to new section in local state (this triggers the animation!)
      setLocalSections((prev) => {
        const activeItem = activeSection.items?.find((i) => i.id === activeId);
        if (!activeItem) return prev;

        return prev.map((section) => {
          if (section.id === activeSection.id) {
            // Remove from source section
            return {
              ...section,
              items: section.items?.filter((i) => i.id !== activeId),
            };
          }
          if (section.id === overSectionId) {
            // Add to target section
            const items = [...(section.items || [])];
            if (overIndex !== null && overIndex >= 0) {
              items.splice(overIndex, 0, activeItem);
            } else {
              items.push(activeItem);
            }
            return { ...section, items };
          }
          return section;
        });
      });
    },
    [localSections, findSectionByItemId]
  );

  // Handle drag end - persist changes to server
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Helper to clear overlay state
      const clearOverlay = () => {
        setActiveItem(null);
        setActiveItemId(null);
      };

      if (!over) {
        // Cancelled - reset to server state synchronously to prevent flash
        flushSync(() => {
          setLocalSections(project.sections || []);
        });
        clearOverlay();
        dragStartSectionRef.current = null;
        return;
      }

      const activeId = active.id as number;
      const overId = over.id;

      // Find current section of the active item (in local state after onDragOver)
      const currentSection = findSectionByItemId(activeId, localSections);
      if (!currentSection) {
        clearOverlay();
        dragStartSectionRef.current = null;
        return;
      }

      // Handle reordering within the same section
      if (typeof overId === 'number' && overId !== activeId) {
        const overSection = findSectionByItemId(overId, localSections);

        if (overSection && overSection.id === currentSection.id) {
          // Same section - reorder
          const items = currentSection.items || [];
          const oldIndex = items.findIndex((i) => i.id === activeId);
          const newIndex = items.findIndex((i) => i.id === overId);

          if (oldIndex !== newIndex) {
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Use flushSync to update positions BEFORE isDragging becomes false
            // This prevents the visual flash where item appears at old position
            flushSync(() => {
              setLocalSections((prev) =>
                prev.map((section) =>
                  section.id === currentSection.id ? { ...section, items: newItems } : section
                )
              );
            });

            // Send to server
            const itemMoves: ItemMove[] = newItems.map((item, index) => ({
              item_id: item.id,
              section_id: currentSection.id,
              position: index,
            }));

            reorderProject.mutate({ item_moves: itemMoves });
          }

          clearOverlay();
          dragStartSectionRef.current = null;
          return;
        }
      }

      // Cross-section move (already moved in onDragOver, now persist)
      const originalSectionId = dragStartSectionRef.current;
      if (originalSectionId && originalSectionId !== currentSection.id) {
        // For cross-section, localSections was updated in onDragOver
        // Force a synchronous render to ensure the update is applied
        flushSync(() => {
          // Identity update to flush any pending state
          setLocalSections((prev) => [...prev]);
        });

        // Build item moves for all affected sections
        const itemMoves: ItemMove[] = [];

        localSections.forEach((section) => {
          if (section.id === originalSectionId || section.id === currentSection.id) {
            section.items?.forEach((item, index) => {
              itemMoves.push({
                item_id: item.id,
                section_id: section.id,
                position: index,
              });
            });
          }
        });

        reorderProject.mutate({ item_moves: itemMoves });
      }

      clearOverlay();
      dragStartSectionRef.current = null;
    },
    [localSections, project.sections, findSectionByItemId, reorderProject]
  );

  return (
    <div>
      {/* Project header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 mb-1">
              Projekt
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{project.name}</h1>
            <p className="mt-2 flex items-center gap-2">
              <span className="text-sm text-neutral-500">Suma projektu:</span>
              <span className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-bold text-white">
                {formatCurrency(project.total_price)}
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Podglad PDF
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Znajdz
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              Sortuj
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtr
            </button>
          </div>
        </div>
      </header>

      {/* Sections with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {localSections.map((section) => (
          <Section key={section.id} section={section} projectId={project.id} />
        ))}

        {/* Drag overlay - shows the item being dragged */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {activeItem ? (
            <div className="rotate-2 scale-105 shadow-2xl">
              <ItemCard item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add section button */}
      <div className="mt-8 mb-16">
        <button
          type="button"
          onClick={handleAddSection}
          disabled={createSection.isPending}
          className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-neutral-300 py-6 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="font-medium">
            {createSection.isPending ? 'Dodawanie...' : 'Dodaj sekcje'}
          </span>
        </button>
      </div>
    </div>
  );
}
