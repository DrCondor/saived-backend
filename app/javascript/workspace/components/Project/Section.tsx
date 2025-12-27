import { useState, useRef, useEffect } from 'react';
import type { ProjectSection, CreateItemInput } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCreateItem, useDeleteItem } from '../../hooks/useItems';
import { useUpdateSection, useDeleteSection } from '../../hooks/useSections';
import ItemCard from './ItemCard';
import AddItemForm from './AddItemForm';

interface SectionProps {
  section: ProjectSection;
  projectId: number;
}

export default function Section({ section, projectId }: SectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateSection = useUpdateSection(projectId);
  const deleteSection = useDeleteSection(projectId);
  const createItem = useCreateItem(projectId, section.id);
  const deleteItem = useDeleteItem(projectId, section.id);

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

  const handleAddItem = (data: CreateItemInput) => {
    createItem.mutate(data);
  };

  const handleDeleteItem = (itemId: number) => {
    deleteItem.mutate(itemId);
  };

  const items = section.items || [];
  const sectionTotal = section.total_price || items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  return (
    <div id={`section-${section.id}`} className="mb-10 scroll-mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-3 flex-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
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
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-lg font-bold text-neutral-900 hover:text-neutral-700 text-left flex-1"
            >
              {section.name}
            </button>
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

      {/* Section content */}
      {!isCollapsed && (
        <>
          {/* Items list */}
          <div className="space-y-3">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDeleteItem}
                isDeleting={deleteItem.isPending}
              />
            ))}

            {items.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-8 text-center">
                <p className="text-sm text-neutral-400">Brak pozycji w tej sekcji</p>
              </div>
            )}
          </div>

          {/* Add item form */}
          <AddItemForm onSubmit={handleAddItem} isSubmitting={createItem.isPending} />
        </>
      )}
    </div>
  );
}
