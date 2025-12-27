import type { ProjectItem } from '../../types';
import { formatCurrency, getStatusColor, getStatusLabel } from '../../utils/formatters';

interface ItemCardProps {
  item: ProjectItem;
  onDelete?: (itemId: number) => void;
  isDeleting?: boolean;
}

export default function ItemCard({ item, onDelete, isDeleting }: ItemCardProps) {
  const isProposal = item.status.toLowerCase() === 'propozycja';
  const cardClasses = isProposal ? 'opacity-60 grayscale-[30%]' : '';

  const handleDelete = () => {
    if (onDelete && confirm('Usunąć tę pozycję?')) {
      onDelete(item.id);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-md hover:border-neutral-300 transition-all ${cardClasses}`}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="shrink-0">
          <div className="h-20 w-20 rounded-xl bg-neutral-100 overflow-hidden">
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-neutral-300">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-neutral-900 truncate">{item.name}</h4>
              {item.note && (
                <p className="mt-0.5 text-sm text-neutral-500 line-clamp-2">
                  {item.note}
                </p>
              )}
              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-neutral-400 hover:text-neutral-600"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  link...
                </a>
              )}
            </div>

            {/* Sum + Status (right side) */}
            <div className="shrink-0 text-right">
              <div className="inline-flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 bg-neutral-50">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wide mr-2">
                  Suma
                </span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(item.total_price)}
                </span>
              </div>

              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide ${
                    item.status === 'zamówione'
                      ? 'bg-emerald-500 text-white'
                      : item.status === 'wybrane'
                      ? 'bg-violet-500 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-neutral-400 uppercase tracking-wide text-[10px]">
                Wymiary
              </span>
              <p className="text-neutral-700 font-medium">
                {item.dimensions || '—'}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 uppercase tracking-wide text-[10px]">
                Kategoria
              </span>
              <p className="text-neutral-700 font-medium">
                {item.category || '—'}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 uppercase tracking-wide text-[10px]">
                Ilość
              </span>
              <p className="text-neutral-700 font-medium">{item.quantity} szt.</p>
            </div>
            <div>
              <span className="text-neutral-400 uppercase tracking-wide text-[10px]">
                Cena
              </span>
              <p className="text-neutral-700 font-medium">
                {formatCurrency(item.unit_price)}
              </p>
            </div>
            {item.discount_label && (
              <div>
                <span className="text-neutral-400 uppercase tracking-wide text-[10px]">
                  Rabat
                </span>
                <p className="text-emerald-600 font-medium">{item.discount_label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons (visible on hover) */}
      {onDelete && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
            title="Usuń"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </button>
        </div>
      )}
    </div>
  );
}
