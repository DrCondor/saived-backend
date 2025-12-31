import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from './formatters';

describe('formatCurrency', () => {
  it('formats positive numbers with PLN suffix', () => {
    expect(formatCurrency(329.99)).toBe('329,99 zł');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00 zł');
  });

  it('formats large numbers with thousands separator', () => {
    const result = formatCurrency(1234567.89);
    // Different locales may use non-breaking space (U+00A0) vs regular space
    expect(result.replace(/\s/g, ' ')).toBe('1 234 567,89 zł');
  });

  it('returns dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('handles negative numbers', () => {
    expect(formatCurrency(-50.00)).toBe('-50,00 zł');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(99.999)).toBe('100,00 zł');
  });
});

describe('formatDate', () => {
  it('formats date in Polish locale', () => {
    const result = formatDate('2024-01-15');
    // Polish format: "15 stycznia 2024"
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('handles ISO date strings', () => {
    const result = formatDate('2024-12-25T10:30:00Z');
    expect(result).toContain('2024');
  });
});

describe('getStatusColor', () => {
  it('returns violet for wybrane', () => {
    expect(getStatusColor('wybrane')).toBe('bg-violet-100 text-violet-700');
  });

  it('returns emerald for zamówione', () => {
    expect(getStatusColor('zamówione')).toBe('bg-emerald-100 text-emerald-700');
  });

  it('returns neutral for propozycja', () => {
    expect(getStatusColor('propozycja')).toBe('bg-neutral-100 text-neutral-600');
  });

  it('returns neutral for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('bg-neutral-100 text-neutral-600');
  });
});

describe('getStatusLabel', () => {
  it('returns WYBRANE for wybrane', () => {
    expect(getStatusLabel('wybrane')).toBe('WYBRANE');
  });

  it('returns ZAMÓWIONE for zamówione', () => {
    expect(getStatusLabel('zamówione')).toBe('ZAMÓWIONE');
  });

  it('returns PROPOZYCJA for propozycja', () => {
    expect(getStatusLabel('propozycja')).toBe('PROPOZYCJA');
  });

  it('returns PROPOZYCJA for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('PROPOZYCJA');
  });
});
