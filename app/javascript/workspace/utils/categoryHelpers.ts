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

export function getCategoryLabel(categoryId: string | null | undefined): string {
  if (!categoryId) return 'BRAK';
  const category = CATEGORIES.find((c) => c.id === categoryId);
  return category?.label || categoryId.toUpperCase();
}

export function getCategoryId(categoryLabel: string): string {
  const category = CATEGORIES.find((c) => c.label === categoryLabel);
  return category?.id || '';
}
