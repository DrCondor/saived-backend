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
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'wybrane':
      return 'bg-violet-100 text-violet-700';
    case 'zamówione':
      return 'bg-emerald-100 text-emerald-700';
    case 'propozycja':
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

/**
 * Get status display label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'wybrane':
      return 'WYBRANE';
    case 'zamówione':
      return 'ZAMÓWIONE';
    case 'propozycja':
    default:
      return 'PROPOZYCJA';
  }
}
