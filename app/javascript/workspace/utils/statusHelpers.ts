import type { CustomStatus } from '../types';

// System statuses configuration
export const SYSTEM_STATUSES = [
  {
    id: 'propozycja',
    label: 'PROPOZYCJA',
    color: 'neutral',
    bgColor: 'bg-neutral-200',
    textColor: 'text-neutral-600',
    includeInSum: false,
  },
  {
    id: 'do_wyceny',
    label: 'DO WYCENY',
    color: 'violet',
    bgColor: 'bg-violet-500',
    textColor: 'text-white',
    includeInSum: true,
  },
  {
    id: 'kupione',
    label: 'KUPIONE',
    color: 'emerald',
    bgColor: 'bg-emerald-500',
    textColor: 'text-white',
    includeInSum: true,
  },
  {
    id: 'bez_statusu',
    label: 'BEZ STATUSU',
    color: 'slate',
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-500',
    includeInSum: true,
  },
] as const;

export type SystemStatusId = typeof SYSTEM_STATUSES[number]['id'];

// Color palette for custom statuses (8 colors matching SAIVED design)
export const COLOR_PALETTE = [
  { id: 'purple', bg: 'bg-purple-500', text: 'text-white', label: 'Purpurowy' },
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-white', label: 'Indygo' },
  { id: 'blue', bg: 'bg-blue-500', text: 'text-white', label: 'Niebieski' },
  { id: 'cyan', bg: 'bg-cyan-500', text: 'text-white', label: 'Cyjan' },
  { id: 'teal', bg: 'bg-teal-500', text: 'text-white', label: 'Morski' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-white', label: 'Pomaranczowy' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-white', label: 'Bursztynowy' },
  { id: 'slate', bg: 'bg-slate-500', text: 'text-white', label: 'Szary' },
] as const;

export type ColorId = typeof COLOR_PALETTE[number]['id'];

// Get color classes for a color ID
export function getColorClasses(colorId: string): { bg: string; text: string } {
  const color = COLOR_PALETTE.find((c) => c.id === colorId);
  return color ? { bg: color.bg, text: color.text } : { bg: 'bg-neutral-500', text: 'text-white' };
}

// Get status configuration (system or custom)
export interface StatusConfig {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
  includeInSum: boolean;
}

export function getStatusConfig(
  statusId: string,
  customStatuses: CustomStatus[] = []
): StatusConfig {
  // Check system statuses first
  const systemStatus = SYSTEM_STATUSES.find((s) => s.id === statusId);
  if (systemStatus) {
    return {
      id: systemStatus.id,
      label: systemStatus.label,
      bgColor: systemStatus.bgColor,
      textColor: systemStatus.textColor,
      includeInSum: systemStatus.includeInSum,
    };
  }

  // Check custom statuses
  const customStatus = customStatuses.find((s) => s.id === statusId);
  if (customStatus) {
    const colors = getColorClasses(customStatus.color);
    return {
      id: customStatus.id,
      label: customStatus.name.toUpperCase(),
      bgColor: colors.bg,
      textColor: colors.text,
      includeInSum: customStatus.include_in_sum,
    };
  }

  // Fallback for unknown status
  return {
    id: statusId,
    label: statusId.toUpperCase(),
    bgColor: 'bg-neutral-300',
    textColor: 'text-neutral-700',
    includeInSum: true,
  };
}

// Get all available statuses (system + custom)
export function getAllStatuses(customStatuses: CustomStatus[] = []): StatusConfig[] {
  const systemConfigs = SYSTEM_STATUSES.map((s) => ({
    id: s.id,
    label: s.label,
    bgColor: s.bgColor,
    textColor: s.textColor,
    includeInSum: s.includeInSum,
  }));

  const customConfigs = customStatuses.map((s) => {
    const colors = getColorClasses(s.color);
    return {
      id: s.id,
      label: s.name.toUpperCase(),
      bgColor: colors.bg,
      textColor: colors.text,
      includeInSum: s.include_in_sum,
    };
  });

  return [...systemConfigs, ...customConfigs];
}

// Check if an item should be included in sum calculation
export function shouldIncludeInSum(
  statusId: string,
  customStatuses: CustomStatus[] = []
): boolean {
  return getStatusConfig(statusId, customStatuses).includeInSum;
}
