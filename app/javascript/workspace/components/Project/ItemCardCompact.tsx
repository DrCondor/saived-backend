import { memo } from 'react';
import type { ProjectItem, UpdateItemInput, CustomStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import EditableField from '../shared/EditableField';
import StatusSelect from '../shared/StatusSelect';

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
  const isProposal = item.status.toLowerCase() === 'propozycja';
  const cardClasses = isDragging ? 'ring-2 ring-emerald-500 shadow-lg' : '';

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
    <div className="group flex items-center gap-2">
      {/* Main card - single row */}
      <div
        className={`flex-1 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:shadow-sm hover:border-neutral-300 transition-all ${cardClasses}`}
      >
        {/* Thumbnail - opacity affected by proposal status */}
        <div className={`shrink-0 w-8 h-8 rounded bg-neutral-100 overflow-hidden ${isProposal ? 'opacity-70' : ''}`}>
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

        {/* Name + external link (adjacent) */}
        <div className={`flex-1 min-w-0 flex items-center gap-1 ${isProposal ? 'opacity-70' : ''}`}>
          <span className="font-medium text-sm text-neutral-900 truncate">
            {item.name}
          </span>
          {/* External link - next to name */}
          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-0.5 rounded text-neutral-300 hover:text-emerald-500 transition-colors"
              title="Otworz link"
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
        </div>

        {/* Category - editable */}
        <div className={`hidden lg:block shrink-0 ${isProposal ? 'opacity-70' : ''}`}>
          <EditableField
            value={item.category}
            onChange={(v) => handleUpdate('category', v)}
            placeholder="Kategoria"
            emptyText="—"
            className="text-xs text-neutral-500"
            inputClassName="w-24 text-xs"
          />
        </div>

        {/* Quantity x Unit Price = Total - unit price editable */}
        <div className={`shrink-0 flex items-center gap-1.5 text-sm ${isProposal ? 'opacity-70' : ''}`}>
          <span className="text-neutral-400 hidden sm:inline">
            {item.quantity} x
          </span>
          <div className="hidden sm:block">
            <EditableField
              value={item.unit_price}
              onChange={(v) => handleUpdate('unit_price', v)}
              type="number"
              placeholder="0"
              className="text-neutral-500 text-sm"
              inputClassName="w-20 text-sm"
            />
          </div>
          <span className="text-neutral-400 hidden sm:inline">=</span>
          <span className="font-semibold text-neutral-900 whitespace-nowrap">
            {formatCurrency(item.total_price)}
          </span>
        </div>

        {/* Status - always full opacity */}
        <div className="shrink-0">
          <StatusSelect
            value={item.status}
            onChange={(v) => handleUpdate('status', v)}
            compact
            customStatuses={customStatuses}
          />
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
