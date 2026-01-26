import { memo } from 'react';
import type { ProjectItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Large contractor icon for moodboard view
function ContractorIconLarge() {
  return (
    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
      <svg className="w-16 h-16 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  );
}

// Large note icon for moodboard view
function NoteIconLarge() {
  return (
    <div className="w-full h-full bg-amber-50 flex items-center justify-center">
      <svg className="w-16 h-16 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

interface ItemCardMoodboardProps {
  item: ProjectItem;
  onToggleFavorite?: (itemId: number, favorite: boolean) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

const ItemCardMoodboard = memo(function ItemCardMoodboard({
  item,
  onToggleFavorite,
  dragHandleProps,
  isDragging,
}: ItemCardMoodboardProps) {
  const isContractor = item.item_type === 'contractor';
  const isNote = item.item_type === 'note';
  const isProduct = item.item_type === 'product';
  const isProposal = item.status?.toLowerCase() === 'propozycja';

  const handleClick = () => {
    // Notes: no click action
    if (isNote) return;
    // Products: open external URL
    if (isProduct && item.external_url) {
      window.open(item.external_url, '_blank', 'noopener,noreferrer');
    }
    // Contractors: open phone dialer if phone exists
    if (isContractor && item.phone) {
      window.location.href = `tel:${item.phone.replace(/\s/g, '')}`;
    }
  };

  return (
    <div
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <div
        {...dragHandleProps}
        onClick={handleClick}
        className={`
          rounded-xl bg-white border overflow-hidden
          transition-all duration-200
          ${isContractor ? 'border-neutral-300' : isNote ? 'border-amber-200' : 'border-neutral-200'}
          ${(isContractor && item.phone) || (isProduct && item.external_url) ? 'cursor-pointer' : ''}
          ${isDragging ? 'shadow-xl ring-2 ring-emerald-500' : 'hover:shadow-lg hover:border-neutral-300'}
          ${isProposal && !isNote ? 'opacity-70' : ''}
        `}
      >
        {/* Image / Contractor Icon / Note Icon */}
        <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
          {isContractor ? (
            <ContractorIconLarge />
          ) : isNote ? (
            <NoteIconLarge />
          ) : item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-neutral-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Discount badge - positioned inside image area */}
          {isProduct && item.discount_label && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-semibold shadow-sm">
              {item.discount_label.split(' ')[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {isNote ? (
            // Note content
            <>
              {item.name && (
                <h3 className="text-sm font-medium text-neutral-900 line-clamp-1 leading-snug">
                  {item.name}
                </h3>
              )}
              <p className={`text-sm text-neutral-500 line-clamp-2 ${item.name ? 'mt-1' : ''}`}>
                {item.note || <span className="italic text-neutral-400">Pusta notatka</span>}
              </p>
            </>
          ) : (
            // Product/Contractor content
            <>
              <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">
                {item.name}
              </h3>
              <div className="mt-1.5 flex items-center gap-2">
                {item.original_unit_price && (
                  <span className="text-xs text-neutral-400 line-through">
                    {formatCurrency(item.original_unit_price * item.quantity)}
                  </span>
                )}
                <span className="text-sm text-neutral-500">
                  {formatCurrency(item.total_price)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* External link indicator - products only */}
        {isProduct && item.external_url && (
          <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-neutral-600"
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
          </div>
        )}

        {/* Phone indicator - contractors */}
        {isContractor && item.phone && (
          <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        )}

        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id, item.favorite ?? false);
            }}
            className={`absolute top-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm transition-all active:scale-110 ${
              isProduct && item.external_url ? 'right-10' : isContractor && item.phone ? 'right-10' : 'right-2'
            } ${
              item.favorite
                ? 'opacity-100 text-rose-500'
                : 'opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-400'
            }`}
            title={item.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <svg
              className="w-3.5 h-3.5 transition-transform duration-200"
              fill={item.favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Contractor badge */}
        {isContractor && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-600 text-[10px] font-medium uppercase tracking-wide">
            Wykonawca
          </div>
        )}

        {/* Note badge */}
        {isNote && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-medium uppercase tracking-wide">
            Notatka
          </div>
        )}

        {/* Proposal indicator - products only */}
        {isProduct && isProposal && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-medium uppercase tracking-wide">
            Propozycja
          </div>
        )}

      </div>
    </div>
  );
});

export default ItemCardMoodboard;
