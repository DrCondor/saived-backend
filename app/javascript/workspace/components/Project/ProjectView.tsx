import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Project, ProjectItem, ProjectSection, SectionGroup, ItemMove, SectionMove, SortOption, FilterState, ViewMode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { shouldIncludeInSum } from '../../utils/statusHelpers';
import { useCreateSection } from '../../hooks/useSections';
import { useCreateSectionGroup } from '../../hooks/useSectionGroups';
import { useUpdateProject } from '../../hooks/useProjects';
import { useReorderProject } from '../../hooks/useReorderProject';
import { useCurrentUser } from '../../hooks/useUser';
import Section, { getCollapsedSections } from './Section';
import SectionGroupBlock from './SectionGroupBlock';
import ProjectToolbar from './ProjectToolbar';

interface ProjectViewProps {
  project: Project;
}

// Helper to reorder array
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export default function ProjectView({ project }: ProjectViewProps) {
  const { data: user } = useCurrentUser();
  const customStatuses = user?.custom_statuses || [];
  const customCategories = user?.custom_categories || [];

  const createSection = useCreateSection(project.id);
  const createSectionGroup = useCreateSectionGroup(project.id);
  const reorderProject = useReorderProject(project.id);
  const updateProject = useUpdateProject();

  // Project name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Project description editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(project.description || '');
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Local state for real-time DnD updates
  const [localSections, setLocalSections] = useState<ProjectSection[]>(project.sections || []);
  const [localGroups, setLocalGroups] = useState<SectionGroup[]>(project.section_groups || []);

  // Toolbar state: search, sort, filter, view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filters, setFilters] = useState<FilterState>({ statuses: [], categories: [] });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Track if an item is being dragged (for showing drop zones on collapsed sections)
  const [isDraggingItem, setIsDraggingItem] = useState(false);

  // Cursor-based detection for collapsed sections (overrides library's center-based detection)
  const [cursorOverCollapsedSectionId, setCursorOverCollapsedSectionId] = useState<number | null>(null);
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const cursorOverRef = useRef<number | null>(null); // Avoid re-renders on every mousemove

  const handleMouseMoveDuringDrag = useCallback((e: MouseEvent) => {
    cursorPosRef.current = { x: e.clientX, y: e.clientY };

    const collapsedSections = getCollapsedSections();
    let foundId: number | null = null;

    for (const sectionId of collapsedSections) {
      const el = document.getElementById(`section-${sectionId}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          foundId = sectionId;
          break;
        }
      }
    }

    // Only trigger re-render when the detected section changes
    if (foundId !== cursorOverRef.current) {
      cursorOverRef.current = foundId;
      setCursorOverCollapsedSectionId(foundId);
    }
  }, []);

  // Sync local state with server data when project changes
  useEffect(() => {
    setLocalSections(project.sections || []);
  }, [project.sections]);

  useEffect(() => {
    setLocalGroups(project.section_groups || []);
  }, [project.section_groups]);

  // Reset toolbar state when project changes
  useEffect(() => {
    setSearchQuery('');
    setSortBy('default');
    setFilters({ statuses: [], categories: [] });
  }, [project.id]);

  // Sync editName when project changes
  useEffect(() => {
    setEditName(project.name);
    setIsEditingName(false);
  }, [project.name, project.id]);

  // Sync editDescription when project changes
  useEffect(() => {
    setEditDescription(project.description || '');
    setIsEditingDescription(false);
  }, [project.description, project.id]);

  // Auto-focus name input when editing
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Auto-focus description textarea when editing
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  // Project name edit handlers
  const handleNameSubmit = () => {
    if (editName.trim() && editName !== project.name) {
      updateProject.mutate({ id: project.id, input: { name: editName.trim() } });
    } else {
      setEditName(project.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(project.name);
      setIsEditingName(false);
    }
  };

  // Project description edit handlers
  const handleDescriptionSubmit = () => {
    const trimmed = editDescription.trim();
    if (trimmed !== (project.description || '')) {
      updateProject.mutate({ id: project.id, input: { description: trimmed || null } });
    } else {
      setEditDescription(project.description || '');
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDescriptionSubmit();
    } else if (e.key === 'Escape') {
      setEditDescription(project.description || '');
      setIsEditingDescription(false);
    }
  };

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
          // Only add to total if status includes in sum
          if (shouldIncludeInSum(item.status, customStatuses)) {
            totalPrice += item.total_price || 0;
          }
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
                // kupione, do_wyceny first, propozycja last
                const approvedOrder: Record<string, number> = { kupione: 0, do_wyceny: 1, bez_statusu: 2, propozycja: 3 };
                return (approvedOrder[a.status] ?? 99) - (approvedOrder[b.status] ?? 99);
              case 'status-proposal':
                // propozycja first
                const proposalOrder: Record<string, number> = { propozycja: 0, bez_statusu: 1, do_wyceny: 2, kupione: 3 };
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
  }, [localSections, searchQuery, filters, sortBy, customStatuses]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    sortBy !== 'default' ||
    filters.statuses.length > 0 ||
    filters.categories.length > 0;

  // Disable DnD when filters/search are active (reordering filtered results is confusing)
  // Also disable for moodboard view (no editing there)
  const isDnDEnabled = !hasActiveFilters && viewMode !== 'moodboard';

  const handleAddSection = () => {
    createSection.mutate({});
  };

  const handleAddGroup = () => {
    createSectionGroup.mutate({});
  };

  // Build top-level entries: groups (with their sections) + standalone sections
  type TopLevelEntry =
    | { type: 'group'; group: SectionGroup; sections: ProjectSection[] }
    | { type: 'section'; section: ProjectSection };

  const topLevelEntries = useMemo((): TopLevelEntry[] => {
    const groupedSectionIds = new Set<number>();

    const groupEntries: TopLevelEntry[] = localGroups.map((group) => {
      const groupSections = localSections
        .filter((s) => s.section_group_id === group.id)
        .sort((a, b) => a.position - b.position);
      groupSections.forEach((s) => groupedSectionIds.add(s.id));
      return { type: 'group' as const, group, sections: groupSections };
    });

    const standaloneSections: TopLevelEntry[] = localSections
      .filter((s) => !groupedSectionIds.has(s.id))
      .map((section) => ({ type: 'section' as const, section }));

    // Interleave by position: groups use group.position, standalone sections use section.position
    return [...groupEntries, ...standaloneSections].sort((a, b) => {
      const posA = a.type === 'group' ? a.group.position : a.section.position;
      const posB = b.type === 'group' ? b.group.position : b.section.position;
      return posA - posB;
    });
  }, [localGroups, localSections]);

  // Handle drag start - track if dragging items + attach cursor listener
  const handleDragStart = useCallback(
    (start: { type: string }) => {
      if (start.type === 'ITEMS') {
        setIsDraggingItem(true);
        cursorOverRef.current = null;
        setCursorOverCollapsedSectionId(null);
        document.addEventListener('mousemove', handleMouseMoveDuringDrag);
      }
    },
    [handleMouseMoveDuringDrag]
  );

  // Handle drag end - dispatch by type, override destination for collapsed sections
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setIsDraggingItem(false);
      document.removeEventListener('mousemove', handleMouseMoveDuringDrag);

      const cursorTargetId = cursorOverRef.current;
      cursorOverRef.current = null;
      setCursorOverCollapsedSectionId(null);

      const { source, type } = result;
      let { destination } = result;

      // For ITEMS drag: if cursor is over a collapsed section, override the destination
      if (type === 'ITEMS' && cursorTargetId !== null) {
        const collapsedSections = getCollapsedSections();
        if (collapsedSections.has(cursorTargetId)) {
          const sourceSectionId = parseInt(source.droppableId.replace('section-', ''), 10);
          // Don't override if dropping back on the same section
          if (cursorTargetId !== sourceSectionId) {
            destination = {
              droppableId: `section-${cursorTargetId}`,
              index: 0, // Will be overridden to append at end by handleItemReorder
            };
          }
        }
      }

      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      if (type === 'TOP_LEVEL') {
        handleTopLevelReorder(result);
      } else if (type === 'SECTIONS') {
        handleSectionMove(result);
      } else if (type === 'ITEMS') {
        handleItemReorder({ ...result, destination });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localSections, localGroups, reorderProject, topLevelEntries, handleMouseMoveDuringDrag]
  );

  // Reorder top-level entries (groups only - standalone sections are now in SECTIONS type)
  const handleTopLevelReorder = useCallback(
    (result: DropResult) => {
      const { destination, source } = result;
      if (!destination) return;

      const reordered = reorder(topLevelEntries, source.index, destination.index);

      // Extract new orders
      const sectionOrder: number[] = [];
      const groupOrder: number[] = [];

      reordered.forEach((entry) => {
        if (entry.type === 'group') {
          groupOrder.push(entry.group.id);
          // Also update positions of sections within the group
          entry.sections.forEach((s) => sectionOrder.push(s.id));
        } else {
          sectionOrder.push(entry.section.id);
        }
      });

      // Optimistic: update local group positions
      const groupPosMap = new Map<number, number>();
      groupOrder.forEach((id, i) => groupPosMap.set(id, i));
      setLocalGroups((prev) =>
        prev.map((g) => {
          const newPos = groupPosMap.get(g.id);
          return newPos !== undefined ? { ...g, position: newPos } : g;
        })
      );

      // Optimistic: update local section positions
      const sectionPosMap = new Map<number, number>();
      sectionOrder.forEach((id, i) => sectionPosMap.set(id, i));
      setLocalSections((prev) =>
        prev.map((s) => {
          const newPos = sectionPosMap.get(s.id);
          return newPos !== undefined ? { ...s, position: newPos } : s;
        })
      );

      reorderProject.mutate({
        section_order: sectionOrder,
        group_order: groupOrder,
      });
    },
    [topLevelEntries, reorderProject]
  );

  // Handle section moves between groups or to/from standalone
  const handleSectionMove = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;

      // Parse section ID from draggableId: "section-{id}"
      const sectionId = parseInt(draggableId.replace('section-', ''), 10);

      // Parse source and destination group IDs
      // droppableId format: "group-{id}" or "ungrouped"
      const sourceGroupId = source.droppableId === 'ungrouped'
        ? null
        : parseInt(source.droppableId.replace('group-', ''), 10);
      const destGroupId = destination.droppableId === 'ungrouped'
        ? null
        : parseInt(destination.droppableId.replace('group-', ''), 10);

      // Build list of sections in destination group/ungrouped
      let destSections: ProjectSection[];
      if (destGroupId === null) {
        destSections = localSections.filter((s) => s.section_group_id === null);
      } else {
        destSections = localSections.filter((s) => s.section_group_id === destGroupId);
      }

      // If moving within the same group, use reorder
      if (sourceGroupId === destGroupId) {
        const reordered = reorder(destSections, source.index, destination.index);
        const sectionMoves: SectionMove[] = reordered.map((s, index) => ({
          section_id: s.id,
          group_id: destGroupId,
          position: index,
        }));

        // Optimistic update
        setLocalSections((prev) =>
          prev.map((s) => {
            const move = sectionMoves.find((m) => m.section_id === s.id);
            if (move) {
              return { ...s, position: move.position };
            }
            return s;
          })
        );

        reorderProject.mutate({ section_moves: sectionMoves });
        return;
      }

      // Moving between groups - need to remove from source and add to dest
      const movedSection = localSections.find((s) => s.id === sectionId);
      if (!movedSection) return;

      // Remove from source list (for position recalculation)
      const sourceSections = sourceGroupId === null
        ? localSections.filter((s) => s.section_group_id === null && s.id !== sectionId)
        : localSections.filter((s) => s.section_group_id === sourceGroupId && s.id !== sectionId);

      // Insert into dest list at the right position
      const newDestSections = [...destSections.filter((s) => s.id !== sectionId)];
      newDestSections.splice(destination.index, 0, movedSection);

      // Build section moves for all affected sections
      const sectionMoves: SectionMove[] = [];

      // Update source group sections positions
      sourceSections.forEach((s, index) => {
        sectionMoves.push({
          section_id: s.id,
          group_id: sourceGroupId,
          position: index,
        });
      });

      // Update dest group sections positions
      newDestSections.forEach((s, index) => {
        sectionMoves.push({
          section_id: s.id,
          group_id: destGroupId,
          position: index,
        });
      });

      // Optimistic update
      setLocalSections((prev) =>
        prev.map((s) => {
          const move = sectionMoves.find((m) => m.section_id === s.id);
          if (move) {
            return { ...s, section_group_id: move.group_id, position: move.position };
          }
          return s;
        })
      );

      reorderProject.mutate({ section_moves: sectionMoves });
    },
    [localSections, reorderProject]
  );

  // Reorder items within/across sections (existing logic)
  const handleItemReorder = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;

      const sourceSectionId = parseInt(source.droppableId.replace('section-', ''), 10);
      const destSectionId = parseInt(destination.droppableId.replace('section-', ''), 10);

      const sourceSection = localSections.find((s) => s.id === sourceSectionId);
      const destSection = localSections.find((s) => s.id === destSectionId);
      if (!sourceSection || !destSection) return;

      const sourceItems = [...(sourceSection.items || [])];
      const [movedItem] = sourceItems.splice(source.index, 1);
      if (!movedItem) return;

      let newSections: ProjectSection[];
      const affectedSectionIds = new Set([sourceSectionId]);

      if (sourceSectionId === destSectionId) {
        const newItems = reorder(sourceSection.items || [], source.index, destination.index);
        newSections = localSections.map((section) =>
          section.id === sourceSectionId ? { ...section, items: newItems } : section
        );
      } else {
        affectedSectionIds.add(destSectionId);
        const destItems = [...(destSection.items || [])];

        // Check if destination section is collapsed - if so, add item at the end
        const collapsedSections = getCollapsedSections();
        const isDestCollapsed = collapsedSections.has(destSectionId);

        if (isDestCollapsed) {
          // Dropping on collapsed section - add to end
          destItems.push(movedItem);
        } else {
          destItems.splice(destination.index, 0, movedItem);
        }

        newSections = localSections.map((section) => {
          if (section.id === sourceSectionId) return { ...section, items: sourceItems };
          if (section.id === destSectionId) return { ...section, items: destItems };
          return section;
        });
      }

      setLocalSections(newSections);

      const itemMoves: ItemMove[] = [];
      newSections.forEach((section) => {
        if (affectedSectionIds.has(section.id)) {
          section.items?.forEach((item, index) => {
            itemMoves.push({ item_id: item.id, section_id: section.id, position: index });
          });
        }
      });

      if (itemMoves.length > 0) {
        reorderProject.mutate({ item_moves: itemMoves });
      }
    },
    [localSections, reorderProject]
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
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleNameKeyDown}
                className="text-xl font-bold tracking-tight text-neutral-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none w-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="group/name text-xl font-bold tracking-tight text-neutral-900 hover:text-neutral-700 text-left flex items-center gap-2"
              >
                {editName}
                <svg
                  className="w-4 h-4 text-neutral-300 opacity-0 group-hover/name:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}

            {/* Project description (for PDF Notatka) */}
            {isEditingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={handleDescriptionSubmit}
                onKeyDown={handleDescriptionKeyDown}
                placeholder="Dodaj opis projektu (opcjonalnie)..."
                rows={2}
                className="mt-1 text-sm text-neutral-600 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none w-full resize-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDescription(true)}
                className="group/desc mt-1 text-sm text-left flex items-center gap-1.5"
              >
                {editDescription ? (
                  <span className="text-neutral-600 hover:text-neutral-800 transition-colors">
                    {editDescription}
                  </span>
                ) : (
                  <span className="text-neutral-400 hover:text-neutral-600 transition-colors">
                    + Dodaj opis projektu
                  </span>
                )}
                <svg
                  className="w-3 h-3 text-neutral-300 opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
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
            customStatuses={customStatuses}
            customCategories={customCategories}
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
            {formatCurrency(filteredTotal)}
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              ({matchCount} z {totalItemCount} produktow)
            </span>
          )}
        </div>
      </header>

      {/* Sections with DnD */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

        <Droppable droppableId="top-level-entries" type="TOP_LEVEL" isDropDisabled={!isDnDEnabled}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {topLevelEntries.map((entry, index) => {
                if (entry.type === 'group') {
                  const groupSections = entry.sections.map((s) => {
                    const processed = processedSections.find((ps) => ps.id === s.id);
                    return processed || s;
                  }).filter((s) => {
                    const hasFiltersActive = searchQuery.trim() || filters.statuses.length > 0 || filters.categories.length > 0;
                    return !hasFiltersActive || (s.items && s.items.length > 0);
                  });

                  return (
                    <Draggable
                      key={`entry-group-${entry.group.id}`}
                      draggableId={`entry-group-${entry.group.id}`}
                      index={index}
                      isDragDisabled={!isDnDEnabled}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? 'bg-white rounded-xl shadow-lg ring-2 ring-emerald-300' : ''}
                        >
                          <SectionGroupBlock
                            group={entry.group}
                            sections={groupSections}
                            projectId={project.id}
                            dragHandleProps={provided.dragHandleProps}
                          >
                            {/* Nested Droppable for sections within the group */}
                            <Droppable droppableId={`group-${entry.group.id}`} type="SECTIONS" isDropDisabled={!isDnDEnabled}>
                              {(dropProvided, dropSnapshot) => (
                                <div
                                  ref={dropProvided.innerRef}
                                  {...dropProvided.droppableProps}
                                  className={`min-h-[20px] rounded-lg transition-colors ${
                                    dropSnapshot.isDraggingOver ? 'bg-emerald-50 ring-2 ring-emerald-300 ring-dashed' : ''
                                  }`}
                                >
                                  {groupSections.map((section, sectionIndex) => (
                                    <Draggable
                                      key={`section-${section.id}`}
                                      draggableId={`section-${section.id}`}
                                      index={sectionIndex}
                                      isDragDisabled={!isDnDEnabled}
                                    >
                                      {(dragProvided, dragSnapshot) => (
                                        <div
                                          ref={dragProvided.innerRef}
                                          {...dragProvided.draggableProps}
                                          className={dragSnapshot.isDragging ? 'bg-white rounded-xl shadow-lg ring-2 ring-emerald-300' : ''}
                                        >
                                          <Section
                                            section={section}
                                            projectId={project.id}
                                            viewMode={viewMode}
                                            isDnDEnabled={isDnDEnabled}
                                            isDraggingItem={isDraggingItem}
                                            cursorOverCollapsedSectionId={cursorOverCollapsedSectionId}
                                            dragHandleProps={dragProvided.dragHandleProps}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {dropProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </SectionGroupBlock>
                        </div>
                      )}
                    </Draggable>
                  );
                }

                // Standalone section - skip rendering here, will be rendered in ungrouped Droppable
                return null;
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Ungrouped sections - separate Droppable for sections not in any group */}
        {(() => {
          const ungroupedSections = localSections
            .filter((s) => s.section_group_id === null)
            .map((s) => {
              const processed = processedSections.find((ps) => ps.id === s.id);
              return processed || s;
            })
            .filter((s) => {
              const hasFiltersActive = searchQuery.trim() || filters.statuses.length > 0 || filters.categories.length > 0;
              return !hasFiltersActive || (s.items && s.items.length > 0);
            })
            .sort((a, b) => a.position - b.position);

          if (ungroupedSections.length === 0 && !isDnDEnabled) return null;

          return (
            <Droppable droppableId="ungrouped" type="SECTIONS" isDropDisabled={!isDnDEnabled}>
              {(dropProvided, dropSnapshot) => (
                <div
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className={`min-h-[20px] rounded-lg transition-colors ${
                    dropSnapshot.isDraggingOver ? 'bg-emerald-50 ring-2 ring-emerald-300 ring-dashed' : ''
                  }`}
                >
                  {ungroupedSections.map((section, index) => (
                    <Draggable
                      key={`section-${section.id}`}
                      draggableId={`section-${section.id}`}
                      index={index}
                      isDragDisabled={!isDnDEnabled}
                    >
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={dragSnapshot.isDragging ? 'bg-white rounded-xl shadow-lg ring-2 ring-emerald-300' : ''}
                        >
                          <Section
                            section={section}
                            projectId={project.id}
                            viewMode={viewMode}
                            isDnDEnabled={isDnDEnabled}
                            isDraggingItem={isDraggingItem}
                            cursorOverCollapsedSectionId={cursorOverCollapsedSectionId}
                            dragHandleProps={dragProvided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })()}
      </DragDropContext>

      {/* Add section / group buttons */}
      <div className="mt-4 mb-8 flex gap-3">
        <button
          type="button"
          onClick={handleAddSection}
          disabled={createSection.isPending}
          className="flex items-center justify-center gap-2 flex-1 rounded-xl border-2 border-dashed border-neutral-300 py-4 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">
            {createSection.isPending ? 'Dodawanie...' : 'Dodaj sekcję'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleAddGroup}
          disabled={createSectionGroup.isPending}
          className="flex items-center justify-center gap-2 flex-1 rounded-xl border-2 border-dashed border-neutral-300 py-4 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="font-medium">
            {createSectionGroup.isPending ? 'Dodawanie...' : 'Dodaj grupę'}
          </span>
        </button>
      </div>
    </div>
  );
}
