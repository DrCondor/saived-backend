import { memo } from 'react';
import type { ProjectItem, UpdateItemInput, CustomStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/categoryHelpers';
import EditableField from '../shared/EditableField';
import StatusSelect from '../shared/StatusSelect';

// Contractor icon - small version
function ContractorIconSmall() {
  return (
    <div className="h-full w-full rounded bg-neutral-200 flex items-center justify-center">
      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  );
}

// Note icon - small version
function NoteIconSmall() {
  return (
    <div className="h-full w-full rounded bg-amber-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

interface ItemCardCompactProps {
  item: ProjectItem;
  onUpdate?: (itemId: number, input: UpdateItemInput) => void;
  onDelete?: (itemId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  customStatuses?: CustomStatus[];
}

const ItemCardCompact = memo(function ItemCardCompact({
  item,
  onUpdate,
  onDelete,
  dragHandleProps,
  isDragging,
  customStatuses = [],
}: ItemCardCompactProps) {
  const isContractor = item.item_type === 'contractor';
  const isNote = item.item_type === 'note';
  const isProduct = item.item_type === 'product';
  const isProposal = item.status?.toLowerCase() === 'propozycja';
  const cardClasses = [
    isDragging ? 'ring-2 ring-emerald-500 shadow-lg' : '',
    isContractor ? 'border-neutral-300' : '',
    isNote ? 'border-amber-200 bg-amber-50/50' : '',
  ].filter(Boolean).join(' ');

  const handleDelete = () => {
    if (onDelete && confirm('Usunac te pozycje?')) {
      onDelete(item.id);
    }
  };

  const handleUpdate = (field: keyof UpdateItemInput, value: string) => {
    if (!onUpdate) return;

    let processedValue: string | number | undefined = value;

    if (field === 'unit_price') {
      const num = parseFloat(value.replace(',', '.'));
      processedValue = isNaN(num) ? undefined : num;
    }

    if (value === '' && field !== 'name') {
      processedValue = undefined;
    }

    onUpdate(item.id, { [field]: processedValue });
  };

  return (
    <div className="group flex items-center gap-2 w-full min-w-0">
      {/* Main card - single row, entire card is draggable */}
      <div
        {...dragHandleProps}
        className={`flex-1 min-w-0 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:shadow-sm hover:border-neutral-300 transition-all overflow-hidden ${cardClasses}`}
      >
        {/* Thumbnail / Icon */}
        <div
          className={`shrink-0 w-8 h-8 ${isProposal && !isNote ? 'opacity-70' : ''}`}
        >
          {isContractor ? (
            <ContractorIconSmall />
          ) : isNote ? (
            <NoteIconSmall />
          ) : (
            <div className="h-full w-full rounded bg-neutral-100 overflow-hidden">
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-neutral-300">
                  <svg
                    className="w-4 h-4"
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
          )}
        </div>

        {/* Name + note content (for notes) / external link/phone (adjacent) */}
        <div className={`flex-1 min-w-0 max-w-[45%] flex items-center gap-1 ${isProposal && !isNote ? 'opacity-70' : ''}`}>
          {isNote ? (
            // Notes: show name (if any) + note content
            <span className="text-sm text-neutral-700 truncate">
              {item.name && <span className="font-medium text-neutral-900">{item.name}: </span>}
              {item.note || <span className="text-neutral-400 italic">Pusta notatka</span>}
            </span>
          ) : (
            <span className="font-medium text-sm text-neutral-900 truncate">
              {item.name}
            </span>
          )}
          {/* External link - for products, next to name */}
          {isProduct && item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-0.5 rounded text-neutral-300 hover:text-emerald-500 transition-colors"
              title="Otwórz link"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
          {/* Phone - for contractors, next to name */}
          {isContractor && item.phone && (
            <a
              href={`tel:${item.phone.replace(/\s/g, '')}`}
              className="shrink-0 p-0.5 rounded text-neutral-300 hover:text-neutral-600 transition-colors"
              title="Zadzwoń"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          )}
        </div>

        {/* Right-aligned columns container */}
        <div className="ml-auto shrink-0 flex items-center gap-3">
          {/* Category - select (products only, not notes) */}
          {isProduct && (
            <div className={`hidden lg:flex w-28 justify-end ${isProposal ? 'opacity-70' : ''}`}>
              <select
                value={item.category || ''}
                onChange={(e) => handleUpdate('category', e.target.value)}
                className="text-[11px] text-neutral-500 bg-transparent border-0 p-0 pr-3 cursor-pointer hover:text-neutral-700 focus:outline-none focus:ring-0 appearance-none truncate"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0 center', backgroundRepeat: 'no-repeat', backgroundSize: '12px' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Empty placeholder for non-products to maintain column alignment */}
          {!isProduct && !isNote && (
            <div className="hidden lg:block w-28" />
          )}

          {/* Price section - different for product vs contractor (hidden for notes) */}
          {!isNote && (
            <div className={`w-64 flex items-center justify-end gap-1 text-sm ${isProposal ? 'opacity-70' : ''}`}>
              {isContractor ? (
                // Contractor: just show total (flat price)
                <span className="font-semibold text-neutral-900 whitespace-nowrap">
                  {formatCurrency(item.total_price)}
                </span>
              ) : (
                // Product: Quantity x Unit Price = Total
                <>
                  <span className="text-neutral-400 hidden sm:inline text-xs whitespace-nowrap">
                    {item.quantity} x
                  </span>
                  <div className="hidden sm:block">
                    <EditableField
                      value={item.unit_price}
                      onChange={(v) => handleUpdate('unit_price', v)}
                      type="number"
                      placeholder="0"
                      className="text-neutral-500 text-xs"
                      inputClassName="w-16 text-xs"
                    />
                  </div>
                  <span className="text-neutral-400 hidden sm:inline text-xs">=</span>
                  {item.original_unit_price && (
                    <span className="text-neutral-400 line-through text-[10px] hidden sm:inline whitespace-nowrap">
                      {formatCurrency(item.original_unit_price * item.quantity)}
                    </span>
                  )}
                  <span className="font-semibold text-neutral-900 whitespace-nowrap">
                    {formatCurrency(item.total_price)}
                  </span>
                  {item.discount_label && (
                    <span className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium whitespace-nowrap">
                      {item.discount_label.split(' ')[0]}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Status - for product and contractor only (hidden for notes) */}
          {!isNote && (
            <div className="w-24">
              <StatusSelect
                value={item.status}
                onChange={(v) => handleUpdate('status', v)}
                compact
                customStatuses={customStatuses}
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions - visible on hover or while dragging */}
      <div
        className={`w-6 shrink-0 flex flex-col items-center gap-0.5 transition-opacity ${
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="p-1 rounded text-neutral-300 hover:text-neutral-500 cursor-grab active:cursor-grabbing touch-none"
          title="Przeciagnij"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Usun"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

export default ItemCardCompact;
