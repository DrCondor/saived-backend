import type { CustomCategory } from '../types';

// Predefined categories for project items
export interface CategoryConfig {
  id: string;
  label: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: '', label: 'BRAK' },
  { id: 'meble', label: 'MEBLE' },
  { id: 'tkaniny', label: 'TKANINY' },
  { id: 'dekoracje', label: 'DEKORACJE' },
  { id: 'armatura_i_ceramika', label: 'ARMATURA I CERAMIKA' },
  { id: 'oswietlenie', label: 'OŚWIETLENIE' },
  { id: 'okladziny_scienne', label: 'OKŁADZINY ŚCIENNE' },
  { id: 'agd', label: 'AGD' },
];

export function getAllCategories(customCategories: CustomCategory[] = []): CategoryConfig[] {
  const customConfigs = customCategories.map((c) => ({
    id: c.id,
    label: c.name.toUpperCase(),
  }));
  return [...CATEGORIES, ...customConfigs];
}

export function getCategoryLabel(
  categoryId: string | null | undefined,
  customCategories: CustomCategory[] = []
): string {
  if (!categoryId) return 'BRAK';
  const all = getAllCategories(customCategories);
  const found = all.find((c) => c.id === categoryId);
  return found?.label || categoryId.toUpperCase();
}

export function getCategoryId(categoryLabel: string): string {
  const category = CATEGORIES.find((c) => c.label === categoryLabel);
  return category?.id || '';
}
