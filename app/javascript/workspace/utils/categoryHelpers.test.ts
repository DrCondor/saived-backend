import { describe, it, expect } from 'vitest';
import { CATEGORIES, getAllCategories, getCategoryLabel, getCategoryId } from './categoryHelpers';
import type { CustomCategory } from '../types';

describe('categoryHelpers', () => {
  const customCategories: CustomCategory[] = [
    { id: 'podlogi', name: 'Podłogi' },
    { id: 'stolarka', name: 'Stolarka' },
  ];

  describe('CATEGORIES', () => {
    it('has BRAK as first entry with empty id', () => {
      expect(CATEGORIES[0]).toEqual({ id: '', label: 'BRAK' });
    });

    it('has 8 system categories', () => {
      expect(CATEGORIES).toHaveLength(8);
    });
  });

  describe('getAllCategories', () => {
    it('returns system categories when no custom categories', () => {
      expect(getAllCategories()).toEqual(CATEGORIES);
      expect(getAllCategories([])).toEqual(CATEGORIES);
    });

    it('appends custom categories after system categories', () => {
      const result = getAllCategories(customCategories);
      expect(result).toHaveLength(10);
      expect(result[8]).toEqual({ id: 'podlogi', label: 'PODŁOGI' });
      expect(result[9]).toEqual({ id: 'stolarka', label: 'STOLARKA' });
    });

    it('uppercases custom category names', () => {
      const result = getAllCategories([{ id: 'test', name: 'lowercase name' }]);
      expect(result[8].label).toBe('LOWERCASE NAME');
    });
  });

  describe('getCategoryLabel', () => {
    it('returns BRAK for null/undefined/empty', () => {
      expect(getCategoryLabel(null)).toBe('BRAK');
      expect(getCategoryLabel(undefined)).toBe('BRAK');
      expect(getCategoryLabel('')).toBe('BRAK');
    });

    it('returns label for system category', () => {
      expect(getCategoryLabel('meble')).toBe('MEBLE');
      expect(getCategoryLabel('agd')).toBe('AGD');
    });

    it('returns label for custom category', () => {
      expect(getCategoryLabel('podlogi', customCategories)).toBe('PODŁOGI');
    });

    it('returns uppercased id for unknown category', () => {
      expect(getCategoryLabel('unknown')).toBe('UNKNOWN');
    });
  });

  describe('getCategoryId', () => {
    it('returns id for known label', () => {
      expect(getCategoryId('MEBLE')).toBe('meble');
    });

    it('returns empty string for unknown label', () => {
      expect(getCategoryId('UNKNOWN')).toBe('');
    });
  });
});
