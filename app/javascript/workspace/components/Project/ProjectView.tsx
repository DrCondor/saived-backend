import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Project, ProjectItem, ProjectSection, ItemMove, SortOption, FilterState, ViewMode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { shouldIncludeInSum } from '../../utils/statusHelpers';
import { useCreateSection } from '../../hooks/useSections';
import { useUpdateProject } from '../../hooks/useProjects';
import { useReorderProject } from '../../hooks/useReorderProject';
import { useCurrentUser } from '../../hooks/useUser';
import Section from './Section';
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

  const createSection = useCreateSection(project.id);
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

  // Toolbar state: search, sort, filter, view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filters, setFilters] = useState<FilterState>({ statuses: [], categories: [] });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Sync local state with server data when project changes
  useEffect(() => {
    setLocalSections(project.sections || []);
  }, [project.sections]);

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

  // Handle drag end - @hello-pangea/dnd style
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;

      // Dropped outside any droppable
      if (!destination) return;

      // Same position - no change
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Parse IDs (format: "section-123" for droppable, "item-456" for draggable)
      const sourceSectionId = parseInt(source.droppableId.replace('section-', ''), 10);
      const destSectionId = parseInt(destination.droppableId.replace('section-', ''), 10);
      const itemId = parseInt(draggableId.replace('item-', ''), 10);

      // Find sections
      const sourceSection = localSections.find((s) => s.id === sourceSectionId);
      const destSection = localSections.find((s) => s.id === destSectionId);

      if (!sourceSection || !destSection) return;

      // Get the item being moved
      const sourceItems = [...(sourceSection.items || [])];
      const [movedItem] = sourceItems.splice(source.index, 1);

      if (!movedItem) return;

      let newSections: ProjectSection[];
      const affectedSectionIds = new Set([sourceSectionId]);

      if (sourceSectionId === destSectionId) {
        // Same section - reorder
        const newItems = reorder(sourceSection.items || [], source.index, destination.index);
        newSections = localSections.map((section) =>
          section.id === sourceSectionId ? { ...section, items: newItems } : section
        );
      } else {
        // Cross-section move
        affectedSectionIds.add(destSectionId);
        const destItems = [...(destSection.items || [])];
        destItems.splice(destination.index, 0, movedItem);

        newSections = localSections.map((section) => {
          if (section.id === sourceSectionId) {
            return { ...section, items: sourceItems };
          }
          if (section.id === destSectionId) {
            return { ...section, items: destItems };
          }
          return section;
        });
      }

      // Update local state immediately for responsive UI
      setLocalSections(newSections);

      // Build item moves for affected sections and send to server
      const itemMoves: ItemMove[] = [];
      newSections.forEach((section) => {
        if (affectedSectionIds.has(section.id)) {
          section.items?.forEach((item, index) => {
            itemMoves.push({
              item_id: item.id,
              section_id: section.id,
              position: index,
            });
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
                {project.name}
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
                {project.description ? (
                  <span className="text-neutral-600 hover:text-neutral-800 transition-colors">
                    {project.description}
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
      <DragDropContext onDragEnd={handleDragEnd}>
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
          <Section
            key={section.id}
            section={section}
            projectId={project.id}
            viewMode={viewMode}
            isDnDEnabled={isDnDEnabled}
          />
        ))}
      </DragDropContext>

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
