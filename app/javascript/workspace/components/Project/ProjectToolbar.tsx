import { useState, useRef, useEffect } from 'react';
import type { SortOption, FilterState, ProjectItem } from '../../types';

interface ProjectToolbarProps {
  projectId: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableCategories: string[];
  availableStatuses: string[];
  matchCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Domyslne' },
  { value: 'name-asc', label: 'Nazwa A-Z' },
  { value: 'name-desc', label: 'Nazwa Z-A' },
  { value: 'price-asc', label: 'Cena rosnaco' },
  { value: 'price-desc', label: 'Cena malejaco' },
  { value: 'status-approved', label: 'Zatwierdzone najpierw' },
  { value: 'status-proposal', label: 'Propozycje najpierw' },
];

const STATUS_LABELS: Record<string, string> = {
  wybrane: 'Wybrane',
  zamowione: 'Zamowione',
  propozycja: 'Propozycja',
};

export default function ProjectToolbar({
  projectId,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filters,
  onFilterChange,
  availableCategories,
  availableStatuses,
  matchCount,
  totalCount,
  hasActiveFilters,
}: ProjectToolbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Keyboard shortcut: Cmd/Ctrl + F to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          onSearchChange('');
        }
        setIsSortOpen(false);
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, onSearchChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const handleToggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleClearFilters = () => {
    onFilterChange({ statuses: [], categories: [] });
    onSearchChange('');
    onSortChange('default');
  };

  const activeFilterCount =
    filters.statuses.length +
    filters.categories.length +
    (searchQuery ? 1 : 0) +
    (sortBy !== 'default' ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* PDF Preview */}
      <a
        href={`/api/v1/projects/${projectId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors whitespace-nowrap flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Podglad PDF
      </a>

      {/* Search */}
      <div className="relative">
        {isSearchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Szukaj produktow..."
                className="w-56 rounded-full border border-neutral-300 bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  {matchCount}/{totalCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Znajdz
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-neutral-400 ml-1">
              <span className="text-xs">⌘</span>F
            </kbd>
          </button>
        )}
      </div>

      {/* Sort dropdown */}
      <div className="relative" ref={sortDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsFilterOpen(false);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            sortBy !== 'default'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          Sortuj
          {sortBy !== 'default' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        {isSortOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-50">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                  sortBy === option.value
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {option.label}
                {sortBy === option.value && (
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter dropdown */}
      <div className="relative" ref={filterDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            setIsSortOpen(false);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            filters.statuses.length > 0 || filters.categories.length > 0
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtr
          {(filters.statuses.length > 0 || filters.categories.length > 0) && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              {filters.statuses.length + filters.categories.length}
            </span>
          )}
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
            {/* Status filters */}
            {availableStatuses.length > 0 && (
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                  Status
                </p>
                <div className="space-y-1">
                  {availableStatuses.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 py-1 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={filters.statuses.includes(status)}
                        onChange={() => handleToggleStatus(status)}
                        className="w-4 h-4 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                        {STATUS_LABELS[status] || status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Category filters */}
            {availableCategories.length > 0 && (
              <div className="px-4 py-2 border-t border-neutral-100">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                  Kategoria
                </p>
                <div className="space-y-1">
                  {availableCategories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 py-1 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => handleToggleCategory(category)}
                        className="w-4 h-4 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-neutral-700 group-hover:text-neutral-900 capitalize">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="px-4 py-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full text-center text-sm text-red-600 hover:text-red-700 py-1"
                >
                  Wyczysc wszystkie filtry
                </button>
              </div>
            )}

            {/* Empty state */}
            {availableStatuses.length === 0 && availableCategories.length === 0 && (
              <div className="px-4 py-4 text-center text-sm text-neutral-500">
                Brak dostepnych filtrow
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear all indicator */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Wyczysc
        </button>
      )}
    </div>
  );
}
