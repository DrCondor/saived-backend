/**
 * Format a number as Polish currency (PLN)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';

  return (
    new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' zł'
  );
}

/**
 * Format a date as Polish locale string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get status badge color classes
 * @deprecated Use getStatusConfig from statusHelpers instead
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'do_wyceny':
      return 'bg-amber-100 text-amber-700';
    case 'kupione':
      return 'bg-emerald-100 text-emerald-700';
    case 'bez_statusu':
      return 'bg-neutral-50 text-neutral-500';
    case 'propozycja':
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

/**
 * Get status display label
 * @deprecated Use getStatusConfig from statusHelpers instead
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'do_wyceny':
      return 'DO WYCENY';
    case 'kupione':
      return 'KUPIONE';
    case 'bez_statusu':
      return 'BEZ STATUSU';
    case 'propozycja':
    default:
      return 'PROPOZYCJA';
  }
}
