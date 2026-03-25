import { useState } from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { formatCurrency } from '../../utils/formatters';
import type { FavoriteItem } from '../../types';

interface FavoritePickerProps {
  onSelect: (itemId: number) => void;
  onClose: () => void;
  isAdding?: boolean;
}

export default function FavoritePicker({ onSelect, onClose, isAdding }: FavoritePickerProps) {
  const { data: favorites, isLoading } = useFavorites();
  const [search, setSearch] = useState('');

  // Filter out notes, then apply search
  const filtered = (favorites ?? [])
    .filter((item) => item.item_type !== 'note')
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">Dodaj z ulubionych</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj w ulubionych..."
          className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
        />
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">
              {search ? 'Brak wyników dla tego wyszukiwania' : 'Brak ulubionych produktów'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <FavoriteRow
              key={item.id}
              item={item}
              onSelect={() => onSelect(item.id)}
              disabled={isAdding}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FavoriteRow({
  item,
  onSelect,
  disabled,
}: {
  item: FavoriteItem;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const isContractor = item.item_type === 'contractor';

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover transition-colors group">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-surface-muted overflow-hidden flex-shrink-0">
        {isContractor ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        ) : item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
        <p className="text-xs text-text-muted truncate">{item.project_name}</p>
      </div>

      {/* Price */}
      <span className="text-sm text-text-tertiary whitespace-nowrap">
        {formatCurrency(item.total_price)}
      </span>

      {/* Add button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        disabled={disabled}
        className="p-1.5 rounded-lg text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
        title="Dodaj do sekcji"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
