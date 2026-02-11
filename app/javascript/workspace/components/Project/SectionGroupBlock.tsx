import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { SectionGroup, ProjectSection, ViewMode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { shouldIncludeInSum } from '../../utils/statusHelpers';
import { useUpdateSectionGroup, useDeleteSectionGroup } from '../../hooks/useSectionGroups';
import { useCreateSection } from '../../hooks/useSections';
import { useCurrentUser } from '../../hooks/useUser';

interface SectionGroupBlockProps {
  group: SectionGroup;
  sections: ProjectSection[]; // For calculating total
  projectId: number;
  viewMode?: ViewMode;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  children?: ReactNode; // Sections rendered by parent (ProjectView)
}

const COLLAPSED_GROUPS_KEY = 'saived_collapsed_groups';

export function getCollapsedGroups(): Set<number> {
  try {
    const stored = localStorage.getItem(COLLAPSED_GROUPS_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

export function setCollapsedGroup(groupId: number, collapsed: boolean) {
  try {
    const groups = getCollapsedGroups();
    if (collapsed) groups.add(groupId);
    else groups.delete(groupId);
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...groups]));
  } catch {}
}

export default function SectionGroupBlock({
  group,
  sections,
  projectId,
  viewMode = 'grid',
  dragHandleProps,
  children,
}: SectionGroupBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => getCollapsedGroups().has(group.id));
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const { data: user } = useCurrentUser();
  const customStatuses = user?.custom_statuses || [];

  const updateGroup = useUpdateSectionGroup(projectId);
  const deleteGroup = useDeleteSectionGroup(projectId);
  const createSection = useCreateSection(projectId);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editName when group name changes from server
  useEffect(() => {
    setEditName(group.name);
  }, [group.name]);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== group.name) {
      updateGroup.mutate({ groupId: group.id, input: { name: editName.trim() } });
    } else {
      setEditName(group.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit();
    else if (e.key === 'Escape') {
      setEditName(group.name);
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

  const groupTotal = useMemo(() => {
    return sections.reduce((sum, section) => {
      const sectionSum = (section.items || [])
        .filter((item) => shouldIncludeInSum(item.status, customStatuses))
        .reduce((s, item) => s + (item.total_price || 0), 0);
      return sum + sectionSum;
    }, 0);
  }, [sections, customStatuses]);

  const handleAddSectionInGroup = () => {
    createSection.mutate({ section_group_id: group.id });
  };

  // View-mode-aware header sizing
  const headerSpacing = viewMode === 'list' ? 'mb-1.5 pb-1' : viewMode === 'moodboard' ? 'mb-2 pb-1.5' : 'mb-3 pb-2';
  const chevronSize = viewMode === 'list' || viewMode === 'moodboard' ? 'w-4 h-4' : 'w-5 h-5';
  const folderIconSize = viewMode === 'list' || viewMode === 'moodboard' ? 'w-4 h-4' : 'w-5 h-5';
  const titleClass = viewMode === 'list' ? 'text-sm font-semibold' : viewMode === 'moodboard' ? 'text-base font-medium' : 'text-lg font-bold';
  const badgeClass = viewMode === 'list' ? 'px-2.5 py-0.5' : viewMode === 'moodboard' ? 'px-3 py-1' : 'px-4 py-1.5';
  const badgeTextClass = viewMode === 'list' || viewMode === 'moodboard' ? 'text-xs font-semibold' : 'text-sm font-bold';

  return (
    <div id={`group-${group.id}`} className="mb-8 scroll-mt-28">
      {/* Group header */}
      <div className={`group/grp flex items-center justify-between ${headerSpacing} border-b-2 border-neutral-300`}>
        <div className="flex items-center gap-3 flex-1" {...dragHandleProps} style={{ cursor: 'default' }}>
          <button
            type="button"
            onClick={() => {
              const next = !isCollapsed;
              setIsCollapsed(next);
              setCollapsedGroup(group.id, next);
            }}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg
              className={`${chevronSize} text-neutral-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Folder icon */}
          <svg className={`${folderIconSize} text-neutral-400 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className={`${titleClass} text-neutral-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none w-full uppercase tracking-wide`}
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onMouseDown={handleNameMouseDown}
              onClick={handleNameClick}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
              className={`group/name ${titleClass} text-neutral-900 hover:text-neutral-700 text-left flex-1 flex items-center gap-2 uppercase tracking-wide select-none`}
            >
              {editName}
              <svg
                className="w-4 h-4 text-neutral-300 opacity-0 group-hover/name:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Group total */}
          <div className={`inline-flex items-center rounded-full bg-neutral-100 border border-neutral-200 ${badgeClass}`}>
            <span className={`${badgeTextClass} text-neutral-700`}>
              {formatCurrency(groupTotal)}
            </span>
          </div>

          {/* Delete group */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Usunąć grupę "${group.name}"? Wszystkie sekcje i produkty w tej grupie zostaną usunięte.`)) {
                deleteGroup.mutate(group.id);
              }
            }}
            disabled={deleteGroup.isPending}
            className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Usuń grupę"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Group content - children rendered by parent */}
      {!isCollapsed && (
        <div className="pl-4 border-l-2 border-neutral-200">
          {children}

          {/* Add section inside group */}
          <div className="mt-2 mb-4">
            <button
              type="button"
              onClick={handleAddSectionInGroup}
              disabled={createSection.isPending}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj sekcję
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
