import { memo } from 'react';
import type { ProjectItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ItemCardMoodboardProps {
  item: ProjectItem;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

const ItemCardMoodboard = memo(function ItemCardMoodboard({
  item,
  dragHandleProps,
  isDragging,
}: ItemCardMoodboardProps) {
  const isProposal = item.status.toLowerCase() === 'propozycja';

  const handleClick = () => {
    if (item.external_url) {
      window.open(item.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`group relative ${isDragging ? 'z-50' : ''}`}
      {...dragHandleProps}
    >
      <div
        onClick={handleClick}
        className={`
          rounded-xl bg-white border border-neutral-200 overflow-hidden
          transition-all duration-200
          ${item.external_url ? 'cursor-pointer' : 'cursor-default'}
          ${isDragging ? 'shadow-xl ring-2 ring-emerald-500' : 'hover:shadow-lg hover:border-neutral-300'}
          ${isProposal ? 'opacity-70' : ''}
        `}
      >
        {/* Image */}
        <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
          {item.thumbnail_url ? (
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
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Name */}
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">
            {item.name}
          </h3>

          {/* Price */}
          <p className="mt-1.5 text-sm text-neutral-500">
            {formatCurrency(item.total_price)}
          </p>
        </div>

        {/* External link indicator */}
        {item.external_url && (
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

        {/* Proposal indicator */}
        {isProposal && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-medium uppercase tracking-wide">
            Propozycja
          </div>
        )}
      </div>
    </div>
  );
});

export default ItemCardMoodboard;
