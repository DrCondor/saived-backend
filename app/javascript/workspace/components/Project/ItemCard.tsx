import { useState, memo, useRef } from 'react';
import type { ProjectItem, UpdateItemInput, CustomStatus, CustomCategory, UnitType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getAllCategories } from '../../utils/categoryHelpers';
import EditableField from '../shared/EditableField';
import StatusSelect from '../shared/StatusSelect';
import UnitTypeSelect from '../shared/UnitTypeSelect';

// Contractor icon component
function ContractorIcon() {
  return (
    <div className="h-full w-full rounded-lg bg-neutral-200 flex items-center justify-center">
      <svg className="w-7 h-7 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  );
}

// Note icon component
function NoteIcon() {
  return (
    <div className="h-full w-full rounded-lg bg-amber-100 flex items-center justify-center">
      <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

interface ItemCardProps {
  item: ProjectItem;
  onUpdate?: (itemId: number, input: UpdateItemInput) => void;
  onDelete?: (itemId: number) => void;
  onToggleFavorite?: (itemId: number, favorite: boolean) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  customStatuses?: CustomStatus[];
  customCategories?: CustomCategory[];
}

// Memoize to prevent re-renders when other items change
const ItemCard = memo(function ItemCard({
  item,
  onUpdate,
  onDelete,
  onToggleFavorite,
  dragHandleProps,
  isDragging,
  customStatuses = [],
  customCategories = [],
}: ItemCardProps) {
  const [isEditingThumbnail, setIsEditingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(item.thumbnail_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isContractor = item.item_type === 'contractor';
  const isNote = item.item_type === 'note';
  const isProduct = item.item_type === 'product';
  const isProposal = item.status?.toLowerCase() === 'propozycja';
  const cardClasses = [
    isProposal && !isNote ? 'opacity-70' : '',
    isDragging ? 'ring-2 ring-emerald-500 shadow-lg' : '',
    isContractor ? 'border-neutral-300' : '',
    isNote ? 'border-amber-200 bg-amber-50/50' : '',
  ].filter(Boolean).join(' ');

  const handleUpdate = (field: keyof UpdateItemInput, value: string) => {
    if (!onUpdate) return;

    let processedValue: string | number | null | undefined = value;

    // Convert numeric fields
    if (field === 'quantity') {
      const num = parseInt(value, 10);
      processedValue = isNaN(num) || num < 1 ? 1 : num;
    } else if (field === 'unit_price') {
      const num = parseFloat(value.replace(',', '.'));
      processedValue = isNaN(num) ? undefined : num;
    } else if (field === 'discount_percent') {
      const num = parseInt(value, 10);
      // Empty string or 0 = remove discount → send null to trigger removal
      if (value === '' || num === 0) {
        processedValue = null;
      } else {
        processedValue = isNaN(num) ? null : Math.max(1, Math.min(100, num));
      }
    }

    // Don't send empty strings for optional fields (except discount fields which need explicit null)
    if (value === '' && field !== 'name' && field !== 'discount_percent' && field !== 'discount_code') {
      processedValue = undefined;
    }

    // discount_code when cleared should send null (not empty string)
    if (field === 'discount_code' && value === '') {
      processedValue = null;
    }

    onUpdate(item.id, { [field]: processedValue });
  };

  const handleThumbnailSave = () => {
    const trimmed = thumbnailUrl.trim();
    if (trimmed !== (item.thumbnail_url || '')) {
      handleUpdate('thumbnail_url', trimmed);
    }
    setIsEditingThumbnail(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Usunąć tę pozycję?')) {
      onDelete(item.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdate) {
      onUpdate(item.id, { attachment: file });
    }
  };

  return (
    <div className="group flex gap-2">
      {/* Item card - entire card is draggable (Trello-style) */}
      <div
        {...dragHandleProps}
        className={`flex-1 rounded-xl border border-neutral-200 bg-white p-3 hover:shadow-md hover:border-neutral-300 transition-all touch-none ${cardClasses}`}
      >
        <div className="flex gap-3">
          {/* Thumbnail / Icon */}
          <div
            className="shrink-0 h-14 w-14 relative group/thumb"
          >
            {isContractor ? (
              // Contractor: static icon
              <ContractorIcon />
            ) : isNote ? (
              // Note: static icon
              <NoteIcon />
            ) : (
              // Product: editable thumbnail
              <>
                <div className="h-full w-full rounded-lg bg-neutral-100 overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-neutral-300">
                      <svg
                        className="w-6 h-6"
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

                {/* Edit thumbnail button - overlay on hover */}
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailUrl(item.thumbnail_url || '');
                    setIsEditingThumbnail(true);
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-lg"
                  title="Edytuj miniaturkę"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {/* Thumbnail URL edit modal */}
                {isEditingThumbnail && (
                  <div className="absolute top-0 left-0 z-50 mt-[-8px] ml-[-8px]">
                    <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-3 w-72">
                      <label className="text-[10px] text-neutral-500 uppercase tracking-wide block mb-1">
                        URL miniaturki
                      </label>
                      <input
                        type="url"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleThumbnailSave();
                          if (e.key === 'Escape') setIsEditingThumbnail(false);
                        }}
                        placeholder="https://..."
                        className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleThumbnailSave}
                          className="flex-1 text-xs bg-emerald-500 text-white rounded-lg py-1.5 hover:bg-emerald-600 transition-colors"
                        >
                          Zapisz
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingThumbnail(false)}
                          className="flex-1 text-xs bg-neutral-100 text-neutral-600 rounded-lg py-1.5 hover:bg-neutral-200 transition-colors"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Name - editable */}
                <div className="font-medium text-neutral-900">
                  <EditableField
                    value={item.name}
                    onChange={(v) => handleUpdate('name', v)}
                    placeholder="Nazwa produktu"
                    required
                    className="font-medium"
                  />
                </div>

                {/* Note - editable */}
                <div className="mt-0.5 text-sm text-neutral-500">
                  <EditableField
                    value={item.note}
                    onChange={(v) => handleUpdate('note', v)}
                    placeholder="Dodaj notatkę..."
                    emptyText="Dodaj notatkę..."
                    className="text-sm"
                  />
                </div>

                {/* External link */}
                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
                    Zobacz produkt
                  </a>
                )}
              </div>

              {/* Sum + Status (right side) - hidden for notes */}
              {!isNote && (
                <div className="shrink-0 text-right space-y-2">
                  <div className="inline-flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 bg-neutral-50">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wide mr-2">
                      Suma
                    </span>
                    <div className="flex flex-col items-end">
                      {item.original_unit_price && item.discount_percent && item.discount_percent > 0 && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatCurrency(item.original_unit_price * item.quantity)}
                        </span>
                      )}
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                    {item.discount_label && (
                      <span className="ml-2 text-xs text-emerald-600 font-medium">
                        {item.discount_label}
                      </span>
                    )}
                  </div>

                  <div>
                    <StatusSelect
                      value={item.status}
                      onChange={(v) => handleUpdate('status', v)}
                      customStatuses={customStatuses}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details grid - conditional for contractor vs product (notes have no details) */}
            {isContractor && (
              // Contractor details
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                {/* Service price */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Cena usługi
                  </span>
                  <div className="flex items-center gap-1">
                    <EditableField
                      value={item.unit_price}
                      onChange={(v) => handleUpdate('unit_price', v)}
                      type="number"
                      placeholder="0.00"
                      className="text-neutral-700 font-medium"
                      inputClassName="w-24"
                    />
                    <span className="text-neutral-500">zł</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Telefon
                  </span>
                  <div className="flex items-center gap-1">
                    <EditableField
                      value={item.phone}
                      onChange={(v) => handleUpdate('phone', v)}
                      placeholder="np. 123 456 789"
                      className="text-neutral-700 font-medium"
                    />
                    {item.phone && (
                      <a
                        href={`tel:${item.phone.replace(/\s/g, '')}`}
                        className="shrink-0 p-1 rounded hover:bg-neutral-100 text-neutral-600"
                        title="Zadzwoń"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Adres
                  </span>
                  <EditableField
                    value={item.address}
                    onChange={(v) => handleUpdate('address', v)}
                    placeholder="np. ul. Przykładowa 10, Warszawa"
                    className="text-neutral-700 font-medium"
                  />
                </div>

                {/* Attachment */}
                <div className="sm:col-span-4">
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Załącznik
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    {item.attachment_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={item.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-800 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {item.attachment_filename || 'Pobierz'}
                        </a>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          (zmień)
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Dodaj załącznik (oferta, umowa...)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {isProduct && (
              // Product details
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                {/* Dimensions */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Wymiary
                  </span>
                  <EditableField
                    value={item.dimensions}
                    onChange={(v) => handleUpdate('dimensions', v)}
                    placeholder="np. 120x80x45"
                    className="text-neutral-700 font-medium"
                  />
                </div>

                {/* Category */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Kategoria
                  </span>
                  <select
                    value={item.category || ''}
                    onChange={(e) => handleUpdate('category', e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-xs text-neutral-700 font-medium bg-transparent border-0 p-0 pr-4 cursor-pointer hover:text-neutral-900 focus:outline-none focus:ring-0 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0 center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                  >
                    {getAllCategories(customCategories).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Ilość
                  </span>
                  <div className="flex items-center gap-1">
                    <EditableField
                      value={item.quantity}
                      onChange={(v) => handleUpdate('quantity', v)}
                      type="number"
                      placeholder="1"
                      className="text-neutral-700 font-medium"
                      inputClassName="w-16"
                    />
                    <UnitTypeSelect
                      value={item.unit_type}
                      onChange={(v: UnitType) => onUpdate?.(item.id, { unit_type: v })}
                    />
                  </div>
                </div>

                {/* Unit price */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Cena jedn.
                  </span>
                  <div className="flex items-center gap-1">
                    <EditableField
                      value={item.unit_price}
                      onChange={(v) => handleUpdate('unit_price', v)}
                      type="number"
                      placeholder="0.00"
                      className="text-neutral-700 font-medium"
                      inputClassName="w-20"
                    />
                    <span className="text-neutral-500">zł</span>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Waluta
                  </span>
                  <EditableField
                    value={item.currency || 'PLN'}
                    onChange={(v) => handleUpdate('currency', v)}
                    placeholder="PLN"
                    className="text-neutral-700 font-medium"
                    inputClassName="w-16"
                  />
                </div>

                {/* Discount percent */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Rabat (%)
                  </span>
                  <div className="flex items-center gap-1">
                    <EditableField
                      value={item.discount_percent}
                      onChange={(v) => handleUpdate('discount_percent', v)}
                      type="number"
                      placeholder="0"
                      className={item.discount_percent ? 'text-emerald-600 font-medium' : 'text-neutral-700 font-medium'}
                      inputClassName="w-16"
                    />
                    <span className="text-neutral-500">%</span>
                  </div>
                </div>

                {/* Discount code */}
                <div>
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Kod rabatowy
                  </span>
                  <EditableField
                    value={item.discount_code}
                    onChange={(v) => handleUpdate('discount_code', v)}
                    placeholder="np. PROMO10"
                    className="text-neutral-700 font-medium"
                    inputClassName="w-24"
                  />
                </div>

                {/* External URL */}
                <div className="sm:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-wide text-[10px] block mb-0.5">
                    Link do produktu
                  </span>
                  <div className="flex items-center gap-2">
                    <EditableField
                      value={item.external_url}
                      onChange={(v) => handleUpdate('external_url', v)}
                      type="url"
                      placeholder="https://..."
                      className="text-neutral-700 font-medium truncate flex-1 max-w-[200px]"
                    />
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1 rounded hover:bg-emerald-50 text-emerald-600"
                        title="Otwórz link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right actions panel - visible on hover or while dragging */}
      <div className={`w-7 shrink-0 flex flex-col items-center gap-0.5 pt-3 transition-opacity ${
        isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item.id, item.favorite ?? false)}
            className={`p-1.5 rounded transition-colors active:scale-125 ${
              item.favorite
                ? 'text-rose-500 hover:text-rose-600'
                : 'text-neutral-300 hover:text-rose-400'
            }`}
            title={item.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <svg className="w-4 h-4 transition-transform duration-200" fill={item.favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Usuń"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default ItemCard;
