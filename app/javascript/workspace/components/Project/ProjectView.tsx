import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import type { Project, ProjectItem, ProjectSection, ItemMove, SortOption, FilterState, ViewMode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCreateSection } from '../../hooks/useSections';
import { useReorderProject } from '../../hooks/useReorderProject';
import Section from './Section';
import ItemCard from './ItemCard';
import ItemCardCompact from './ItemCardCompact';
import ProjectToolbar from './ProjectToolbar';

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

  // Toolbar state: search, sort, filter, view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filters, setFilters] = useState<FilterState>({ statuses: [], categories: [] });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Track the original section of the dragged item (for API call)
  const dragStartSectionRef = useRef<number | null>(null);

  // Sync local state with server data when project changes (and not dragging)
  useEffect(() => {
    if (!activeItemId) {
      setLocalSections(project.sections || []);
    }
  }, [project.sections, activeItemId]);

  // Reset toolbar state when project changes
  useEffect(() => {
    setSearchQuery('');
    setSortBy('default');
    setFilters({ statuses: [], categories: [] });
  }, [project.id]);

  // Compute available statuses and categories from all items
  const { availableStatuses, availableCategories, totalItemCount } = useMemo(() => {
    const statuses = new Set<string>();
    const categories = new Set<string>();
    let count = 0;

    localSections.forEach((section) => {
      section.items?.forEach((item) => {
        count++;
        if (item.status) statuses.add(item.status);
        if (item.category) categories.add(item.category);
      });
    });

    return {
      availableStatuses: Array.from(statuses).sort(),
      availableCategories: Array.from(categories).filter(Boolean).sort(),
      totalItemCount: count,
    };
  }, [localSections]);

  // Apply search, filters, and sorting to sections
  const { processedSections, matchCount, filteredTotal } = useMemo(() => {
    let matchedItems = 0;
    let totalPrice = 0;

    const processed = localSections
      .map((section) => {
        let items = section.items || [];

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          items = items.filter((item) => {
            const nameMatch = item.name?.toLowerCase().includes(query);
            const noteMatch = item.note?.toLowerCase().includes(query);
            const categoryMatch = item.category?.toLowerCase().includes(query);
            // Extract domain from URL for searching (safely handle invalid URLs)
            let domain = '';
            if (item.external_url) {
              try {
                domain = new URL(item.external_url).hostname.replace('www.', '');
              } catch {
                domain = item.external_url;
              }
            }
            const urlMatch = domain.toLowerCase().includes(query);
            return nameMatch || noteMatch || categoryMatch || urlMatch;
          });
        }

        // Apply status filter
        if (filters.statuses.length > 0) {
          items = items.filter((item) => filters.statuses.includes(item.status));
        }

        // Apply category filter
        if (filters.categories.length > 0) {
          items = items.filter((item) => item.category && filters.categories.includes(item.category));
        }

        matchedItems += items.length;
        items.forEach((item) => {
          totalPrice += item.total_price || 0;
        });

        // Apply sorting
        if (sortBy !== 'default') {
          items = [...items].sort((a, b) => {
            switch (sortBy) {
              case 'name-asc':
                return (a.name || '').localeCompare(b.name || '', 'pl');
              case 'name-desc':
                return (b.name || '').localeCompare(a.name || '', 'pl');
              case 'price-asc':
                return (a.total_price || 0) - (b.total_price || 0);
              case 'price-desc':
                return (b.total_price || 0) - (a.total_price || 0);
              case 'status-approved':
                // wybrane, zamowione first, propozycja last
                const approvedOrder: Record<string, number> = { wybrane: 0, zamowione: 1, propozycja: 2 };
                return (approvedOrder[a.status] ?? 99) - (approvedOrder[b.status] ?? 99);
              case 'status-proposal':
                // propozycja first
                const proposalOrder: Record<string, number> = { propozycja: 0, wybrane: 1, zamowione: 2 };
                return (proposalOrder[a.status] ?? 99) - (proposalOrder[b.status] ?? 99);
              default:
                return 0;
            }
          });
        }

        return { ...section, items };
      })
      // Hide empty sections when filtering/searching
      .filter((section) => {
        const hasFiltersActive = searchQuery.trim() || filters.statuses.length > 0 || filters.categories.length > 0;
        return !hasFiltersActive || (section.items && section.items.length > 0);
      });

    return { processedSections: processed, matchCount: matchedItems, filteredTotal: totalPrice };
  }, [localSections, searchQuery, filters, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    sortBy !== 'default' ||
    filters.statuses.length > 0 ||
    filters.categories.length > 0;

  // DnD sensors with activation constraint to prevent accidental drags
  // Disable DnD when filters/search are active (reordering filtered results is confusing)
  const isDnDEnabled = !hasActiveFilters;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isDnDEnabled ? 8 : 10000, // Effectively disable when filters active
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
      <header className="mb-4">
        {/* Top row: Project name + Toolbar */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 mb-1">
              Projekt
            </p>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">{project.name}</h1>
          </div>

          {/* Toolbar with search, sort, filter */}
          <ProjectToolbar
            projectId={project.id}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filters={filters}
            onFilterChange={setFilters}
            availableCategories={availableCategories}
            availableStatuses={availableStatuses}
            matchCount={matchCount}
            totalCount={totalItemCount}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Sum row - separate to avoid layout conflicts */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            {hasActiveFilters ? 'Suma wynikow:' : 'Suma projektu:'}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold whitespace-nowrap ${
              hasActiveFilters
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-900 text-white'
            }`}
          >
            {formatCurrency(hasActiveFilters ? filteredTotal : project.total_price)}
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              ({matchCount} z {totalItemCount} produktow)
            </span>
          )}
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
        {/* No results message */}
        {hasActiveFilters && processedSections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-neutral-600 font-medium mb-1">Brak wynikow</p>
            <p className="text-sm text-neutral-400 mb-4">
              Nie znaleziono produktow pasujacych do kryteriow
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSortBy('default');
                setFilters({ statuses: [], categories: [] });
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Wyczysc filtry
            </button>
          </div>
        )}

        {processedSections.map((section) => (
          <Section key={section.id} section={section} projectId={project.id} viewMode={viewMode} />
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
              {viewMode === 'list' ? (
                <ItemCardCompact item={activeItem} />
              ) : (
                <ItemCard item={activeItem} />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add section button */}
      <div className="mt-4 mb-8">
        <button
          type="button"
          onClick={handleAddSection}
          disabled={createSection.isPending}
          className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-neutral-300 py-4 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
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
