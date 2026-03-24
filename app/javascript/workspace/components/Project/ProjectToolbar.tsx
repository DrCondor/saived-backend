import { useState, useRef, useEffect } from 'react';
import type { SortOption, FilterState, ViewMode, CustomStatus, CustomCategory } from '../../types';
import { getStatusConfig } from '../../utils/statusHelpers';
import { getCategoryLabel } from '../../utils/categoryHelpers';
import { downloadPdf } from '../../api/projects';

interface ProjectToolbarProps {
  projectId: number;
  itemIds: number[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableCategories: string[];
  availableStatuses: string[];
  customStatuses: CustomStatus[];
  customCategories: CustomCategory[];
  matchCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
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

export default function ProjectToolbar({
  projectId,
  itemIds,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filters,
  onFilterChange,
  availableCategories,
  availableStatuses,
  customStatuses,
  customCategories,
  matchCount,
  totalCount,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
}: ProjectToolbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

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

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      const blob = await downloadPdf(projectId, itemIds);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after a delay to allow the browser to load the PDF
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const activeFilterCount =
    filters.statuses.length +
    filters.categories.length +
    (searchQuery ? 1 : 0) +
    (sortBy !== 'default' ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* View mode toggle */}
      <div className="inline-flex items-stretch rounded-full border border-border bg-surface overflow-hidden flex-shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          className={`flex items-center justify-center px-2.5 py-2 transition-colors ${
            viewMode === 'grid'
              ? 'bg-surface-muted text-text-secondary'
              : 'text-text-muted hover:text-text-tertiary hover:bg-surface-hover'
          }`}
          title="Widok kart"
        >
          {/* Card icon - rectangle with thumbnail and text lines */}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <rect x="1" y="1" width="14" height="14" rx="2" fillOpacity="0.15"/>
            <rect x="2.5" y="2.5" width="4" height="4" rx="0.5"/>
            <rect x="8" y="3" width="5.5" height="1.5" rx="0.5"/>
            <rect x="8" y="5.5" width="4" height="1" rx="0.5" fillOpacity="0.5"/>
            <rect x="2.5" y="8.5" width="11" height="1" rx="0.5" fillOpacity="0.4"/>
            <rect x="2.5" y="10.5" width="9" height="1" rx="0.5" fillOpacity="0.4"/>
            <rect x="2.5" y="12.5" width="6" height="1" rx="0.5" fillOpacity="0.4"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`flex items-center justify-center px-2.5 py-2 transition-colors ${
            viewMode === 'list'
              ? 'bg-surface-muted text-text-secondary'
              : 'text-text-muted hover:text-text-tertiary hover:bg-surface-hover'
          }`}
          title="Widok listy"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('moodboard')}
          className={`flex items-center justify-center px-2.5 py-2 transition-colors ${
            viewMode === 'moodboard'
              ? 'bg-surface-muted text-text-secondary'
              : 'text-text-muted hover:text-text-tertiary hover:bg-surface-hover'
          }`}
          title="Moodboard"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <rect x="1" y="1" width="6" height="6" rx="1"/>
            <rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/>
            <rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
        </button>
      </div>

      {/* PDF Preview */}
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isPdfLoading}
        className="inline-flex items-center gap-1.5 rounded-full border border-border-hover bg-surface px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPdfLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )}
        {isPdfLoading ? 'Generowanie...' : 'Podgląd PDF'}
      </button>

      {/* Search */}
      <div className="relative">
        {isSearchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
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
                className="w-56 rounded-full border border-border-hover bg-surface pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
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
              className="p-1.5 rounded-full text-text-muted hover:text-text-tertiary hover:bg-surface-muted"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-border-hover bg-surface px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors whitespace-nowrap flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Znajdź
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-text-muted ml-1">
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
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
              : 'border-border-hover bg-surface text-text-secondary hover:bg-surface-hover'
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
          <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg dark:shadow-none dark:ring-1 dark:ring-border border border-border py-1 z-50">
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-text-secondary hover:bg-surface-hover'
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
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
              : 'border-border-hover bg-surface text-text-secondary hover:bg-surface-hover'
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
          <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lg dark:shadow-none dark:ring-1 dark:ring-border border border-border py-2 z-50">
            {/* Status filters */}
            {availableStatuses.length > 0 && (
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
                  Status
                </p>
                <div className="space-y-1">
                  {availableStatuses.map((status) => {
                    const statusConfig = getStatusConfig(status, customStatuses);
                    return (
                      <label
                        key={status}
                        className="flex items-center gap-2 py-1 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={filters.statuses.includes(status)}
                          onChange={() => handleToggleStatus(status)}
                          className="w-4 h-4 rounded border-border-hover text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="flex-1 text-sm text-text-secondary group-hover:text-text-primary">
                          {statusConfig.label}
                        </span>
                        <span className={`w-3 h-3 rounded-full ${statusConfig.bgColor}`} />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category filters */}
            {availableCategories.length > 0 && (
              <div className="px-4 py-2 border-t border-border-subtle">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
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
                        className="w-4 h-4 rounded border-border-hover text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary">
                        {getCategoryLabel(category, customCategories)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="px-4 py-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full text-center text-sm text-red-600 hover:text-red-700 py-1"
                >
                  Wyczyść wszystkie filtry
                </button>
              </div>
            )}

            {/* Empty state */}
            {availableStatuses.length === 0 && availableCategories.length === 0 && (
              <div className="px-4 py-4 text-center text-sm text-text-tertiary">
                Brak dostępnych filtrów
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
          className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Wyczyść
        </button>
      )}
    </div>
  );
}
