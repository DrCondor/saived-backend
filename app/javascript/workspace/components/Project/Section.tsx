import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Droppable, Draggable, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { ProjectSection, CreateItemInput, UpdateItemInput, ViewMode, ItemType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { shouldIncludeInSum } from '../../utils/statusHelpers';
import { useCreateItem, useUpdateItem, useDeleteItem } from '../../hooks/useItems';
import { useUpdateSection, useDeleteSection } from '../../hooks/useSections';
import { useCurrentUser } from '../../hooks/useUser';
import { useToggleFavorite } from '../../hooks/useFavorites';
import ItemCard from './ItemCard';
import ItemCardCompact from './ItemCardCompact';
import ItemCardMoodboard from './ItemCardMoodboard';
import AddItemForm from './AddItemForm';

interface SectionProps {
  section: ProjectSection;
  projectId: number;
  viewMode: ViewMode;
  isDnDEnabled: boolean;
  isDraggingItem?: boolean;
  cursorOverCollapsedSectionId?: number | null;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

// Helper to get/set section collapsed state in localStorage
const COLLAPSED_SECTIONS_KEY = 'saived_collapsed_sections';

export function getCollapsedSections(): Set<number> {
  try {
    const stored = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore localStorage errors
  }
  return new Set();
}

function setCollapsedSection(sectionId: number, collapsed: boolean) {
  try {
    const sections = getCollapsedSections();
    if (collapsed) {
      sections.add(sectionId);
    } else {
      sections.delete(sectionId);
    }
    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...sections]));
  } catch {
    // Ignore localStorage errors
  }
}

export default function Section({ section, projectId, viewMode, isDnDEnabled, isDraggingItem, cursorOverCollapsedSectionId, dragHandleProps }: SectionProps) {
  // Initialize collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => getCollapsedSections().has(section.id));
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [openForm, setOpenForm] = useState<ItemType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const { data: user } = useCurrentUser();
  const customStatuses = user?.custom_statuses || [];
  const customCategories = user?.custom_categories || [];

  const updateSection = useUpdateSection(projectId);
  const deleteSection = useDeleteSection(projectId);
  const createItem = useCreateItem(projectId, section.id);
  const updateItem = useUpdateItem(projectId, section.id);
  const deleteItem = useDeleteItem(projectId, section.id);
  const toggleFavorite = useToggleFavorite();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== section.name) {
      updateSection.mutate({ sectionId: section.id, input: { name: editName.trim() } });
    } else {
      setEditName(section.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(section.name);
      setIsEditing(false);
    }
  };

  // Track mouse position to differentiate click from drag
  const handleNameMouseDown = (e: React.MouseEvent) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleNameClick = (e: React.MouseEvent) => {
    // If the mouse moved more than 5px, it was a drag attempt - don't trigger edit
    if (dragStartPosRef.current) {
      const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
      const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
      if (dx > 5 || dy > 5) {
        dragStartPosRef.current = null;
        return;
      }
    }
    dragStartPosRef.current = null;
    setIsEditing(true);
  };

  const handleAddItem = useCallback((data: CreateItemInput) => {
    createItem.mutate(data);
  }, [createItem]);

  const handleUpdateItem = useCallback((itemId: number, input: UpdateItemInput) => {
    updateItem.mutate({ itemId, input });
  }, [updateItem]);

  const handleDeleteItem = useCallback((itemId: number) => {
    deleteItem.mutate(itemId);
  }, [deleteItem]);

  const handleToggleFavorite = useCallback((itemId: number, favorite: boolean) => {
    toggleFavorite.mutate({ itemId, favorite });
  }, [toggleFavorite]);

  const items = section.items || [];

  // Calculate section total locally, filtering items by include_in_sum status
  // Always calculate on frontend for reactive updates when status changes
  const sectionTotal = useMemo(() => {
    return items
      .filter((item) => shouldIncludeInSum(item.status, customStatuses))
      .reduce((sum, item) => sum + (item.total_price || 0), 0);
  }, [items, customStatuses]);

  // Render item based on view mode
  const renderItem = (item: typeof items[0], isDragging: boolean = false) => {
    if (viewMode === 'moodboard') {
      return (
        <ItemCardMoodboard
          item={item}
          onToggleFavorite={handleToggleFavorite}
        />
      );
    }
    if (viewMode === 'list') {
      return (
        <ItemCardCompact
          item={item}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onToggleFavorite={handleToggleFavorite}
          customStatuses={customStatuses}
          customCategories={customCategories}
          isDragging={isDragging}
        />
      );
    }
    return (
      <ItemCard
        item={item}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
        onToggleFavorite={handleToggleFavorite}
        customStatuses={customStatuses}
        customCategories={customCategories}
        isDragging={isDragging}
      />
    );
  };

  // Is this a collapsed section that can receive drops?
  const canReceiveDropsWhenCollapsed = isCollapsed && isDnDEnabled && viewMode !== 'moodboard';

  // Header content - extracted to reuse in both collapsed (Droppable) and expanded modes
  const renderHeader = (isDroppingOver: boolean = false) => (
    <div
      className={`group/section flex items-center justify-between mb-3 pb-2 border-b transition-colors rounded-lg ${
        isDroppingOver
          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300'
          : isDraggingItem && canReceiveDropsWhenCollapsed
            ? 'border-neutral-300 bg-neutral-50'
            : 'border-neutral-200'
      }`}
    >
      <div className="flex items-center gap-3 flex-1" {...dragHandleProps} style={{ cursor: 'default' }}>
        <button
          type="button"
          onClick={() => {
            const newCollapsed = !isCollapsed;
            setIsCollapsed(newCollapsed);
            setCollapsedSection(section.id, newCollapsed);
          }}
          className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <svg
            className={`w-5 h-5 text-neutral-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="text-lg font-bold text-neutral-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none w-full"
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            onMouseDown={handleNameMouseDown}
            onClick={handleNameClick}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
            className="group/name text-lg font-bold text-neutral-900 hover:text-neutral-700 text-left flex-1 flex items-center gap-2 select-none"
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
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Section total */}
        <div className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5">
          <span className="text-sm font-bold text-emerald-700">
            {formatCurrency(sectionTotal)}
          </span>
        </div>

        {/* Delete section button */}
        <button
          type="button"
          onClick={() => {
            if (confirm(`Usunąć sekcję "${section.name}"? Wszystkie pozycje w tej sekcji zostaną usunięte.`)) {
              deleteSection.mutate(section.id);
            }
          }}
          disabled={deleteSection.isPending}
          className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Usuń sekcję"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div id={`section-${section.id}`} className="mb-6 scroll-mt-28">
      {/* Section header - is a Droppable when collapsed, otherwise just a header */}
      {canReceiveDropsWhenCollapsed ? (
        <Droppable
          droppableId={`section-${section.id}`}
          type="ITEMS"
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {renderHeader(cursorOverCollapsedSectionId === section.id)}
              <div style={{ display: 'none' }}>{provided.placeholder}</div>
            </div>
          )}
        </Droppable>
      ) : !isCollapsed ? (
        renderHeader()
      ) : (
        // Collapsed but DnD disabled or moodboard view - just render header
        renderHeader()
      )}

      {/* Section content - only when expanded */}
      {!isCollapsed && (
        <>
          {/* Items list - droppable zone */}
          {viewMode === 'moodboard' ? (
            // Moodboard: No DnD, just render items in grid
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[40px]">
              {items.map((item) => (
                <div key={item.id}>
                  {renderItem(item)}
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-full rounded-2xl border-2 border-dashed border-neutral-200 py-8 text-center">
                  <p className="text-sm text-neutral-400">Brak pozycji w tej sekcji</p>
                </div>
              )}
            </div>
          ) : (
            // Grid/List view: With DnD
            <Droppable
              droppableId={`section-${section.id}`}
              type="ITEMS"
              isDropDisabled={!isDnDEnabled}
              ignoreContainerClipping
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[40px] rounded-xl transition-colors space-y-2 ${
                    snapshot.isDraggingOver ? 'bg-emerald-50 ring-2 ring-emerald-300 ring-dashed' : ''
                  }`}
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={`item-${item.id}`}
                      index={index}
                      isDragDisabled={!isDnDEnabled}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            cursor: 'default',
                          }}
                        >
                          {renderItem(item, snapshot.isDragging)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {items.length === 0 && !snapshot.isDraggingOver && (
                    <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-8 text-center">
                      <p className="text-sm text-neutral-400">Brak pozycji w tej sekcji</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          )}

          {/* Add item buttons / form */}
          {openForm === null ? (
            <div className="mt-3 flex rounded-lg border border-dashed border-neutral-200 overflow-hidden">
              {/* Left: + Produkt */}
              <button
                type="button"
                onClick={() => setOpenForm('product')}
                className="flex-1 inline-flex items-center justify-center gap-1 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Produkt
              </button>

              {/* Divider */}
              <div className="w-px bg-neutral-200" />

              {/* Middle: + Wykonawca */}
              <button
                type="button"
                onClick={() => setOpenForm('contractor')}
                className="flex-1 inline-flex items-center justify-center gap-1 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Wykonawca
              </button>

              {/* Divider */}
              <div className="w-px bg-neutral-200" />

              {/* Right: + Notatka */}
              <button
                type="button"
                onClick={() => setOpenForm('note')}
                className="flex-1 inline-flex items-center justify-center gap-1 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Notatka
              </button>
            </div>
          ) : (
            <AddItemForm
              itemType={openForm}
              onSubmit={handleAddItem}
              isSubmitting={createItem.isPending}
              onClose={() => setOpenForm(null)}
              customCategories={customCategories}
            />
          )}
        </>
      )}
    </div>
  );
}
