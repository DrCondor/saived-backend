import type { UnitType } from '../types';

export interface UnitTypeConfig {
  id: UnitType;
  label: string;
  fullName: string;
}

/**
 * Unit types for quantity measurement
 * Order: most common in furniture/interior design industry first
 */
export const UNIT_TYPES: UnitTypeConfig[] = [
  { id: 'szt', label: 'szt.', fullName: 'sztuka' },
  { id: 'kpl', label: 'kpl.', fullName: 'komplet' },
  { id: 'zestaw', label: 'zestaw', fullName: 'zestaw' },
  { id: 'opak', label: 'opak.', fullName: 'opakowanie' },
  { id: 'mb', label: 'mb.', fullName: 'metr bieżący' },
  { id: 'm2', label: 'm²', fullName: 'metr kwadratowy' },
  { id: 'm3', label: 'm³', fullName: 'metr sześcienny' },
  { id: 'l', label: 'l', fullName: 'litr' },
  { id: 'kg', label: 'kg', fullName: 'kilogram' },
] as const;

/**
 * Default unit type for new items
 */
export const DEFAULT_UNIT_TYPE: UnitType = 'szt';

/**
 * Get unit type configuration by ID
 */
export function getUnitTypeConfig(unitType: UnitType): UnitTypeConfig {
  return UNIT_TYPES.find((u) => u.id === unitType) ?? UNIT_TYPES[0];
}

/**
 * Get display label for a unit type (e.g., "szt." for "szt")
 */
export function getUnitLabel(unitType: UnitType): string {
  return getUnitTypeConfig(unitType).label;
}
