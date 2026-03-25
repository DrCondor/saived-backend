import { useState, useRef } from 'react';
import type { CreateItemInput, ItemType, CustomCategory } from '../../types';
import { SYSTEM_STATUSES } from '../../utils/statusHelpers';
import { UNIT_TYPES, DEFAULT_UNIT_TYPE, allowsDecimalQuantity } from '../../utils/unitTypes';
import { getAllCategories } from '../../utils/categoryHelpers';

interface AddItemFormProps {
  onSubmit: (data: CreateItemInput) => void;
  isSubmitting?: boolean;
  itemType: ItemType;
  onClose: () => void;
  customCategories?: CustomCategory[];
}

const getDefaultFormData = (itemType: ItemType): CreateItemInput => ({
  name: '',
  quantity: itemType === 'product' ? 1 : undefined,
  unit_type: DEFAULT_UNIT_TYPE,
  status: 'bez_statusu',
  unit_price: undefined,
  dimensions: '',
  category: '',
  discount_percent: undefined,
  discount_code: '',
  thumbnail_url: '',
  external_url: '',
  note: '',
  item_type: itemType,
  address: '',
  phone: '',
  attachment: undefined,
});

export default function AddItemForm({ onSubmit, isSubmitting, itemType, onClose, customCategories = [] }: AddItemFormProps) {
  const [formData, setFormData] = useState<CreateItemInput>(() => getDefaultFormData(itemType));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(getDefaultFormData(itemType));
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
      };
      // Round quantity when switching to a countable unit
      if (name === 'unit_type' && updated.quantity && !allowsDecimalQuantity(value as any)) {
        updated.quantity = Math.ceil(updated.quantity);
      }
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      attachment: file,
    }));
  };

  const isContractor = itemType === 'contractor';
  const isNote = itemType === 'note';
  const isProduct = itemType === 'product';

  // Determine header content based on item type
  const getHeaderContent = () => {
    if (isNote) {
      return (
        <>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">Nowa notatka</span>
        </>
      );
    }
    if (isContractor) {
      return (
        <>
          <div className="w-8 h-8 rounded-lg bg-surface-inset flex items-center justify-center">
            <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">Nowy wykonawca</span>
        </>
      );
    }
    return (
      <>
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary">Nowy produkt</span>
      </>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 mt-4">
      {/* Form header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
        {getHeaderContent()}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Note-specific fields */}
          {isNote && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Tytuł notatki (opcjonalnie)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. Informacja dla klienta"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Treść notatki
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. Poniżej przedstawiam trzy propozycje płytki na ściany do łazienki..."
                />
              </div>
            </>
          )}

          {/* Name field - for product and contractor */}
          {!isNote && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-tertiary mb-1">
                {isContractor ? 'Nazwa wykonawcy / firmy' : 'Nazwa produktu'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                placeholder={isContractor ? 'np. Elektryk - Jan Kowalski' : 'np. Szafka nocna IKEA MALM'}
              />
            </div>
          )}

          {/* Product-specific fields */}
          {isProduct && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">Ilość</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min={allowsDecimalQuantity(formData.unit_type as any) ? 0.01 : 1}
                    step={allowsDecimalQuantity(formData.unit_type as any) ? "any" : "1"}
                    className="flex-1 rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                  <select
                    name="unit_type"
                    value={formData.unit_type}
                    onChange={handleChange}
                    className="w-24 rounded-xl border border-border-hover bg-surface px-2 py-2 text-sm text-text-primary focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  >
                    {UNIT_TYPES.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Cena jednostkowa (zł)
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price ?? ''}
                  onChange={handleChange}
                  step={0.01}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. 250.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">Wymiary</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. 120x60x40 cm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">Kategoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                >
                  {getAllCategories(customCategories).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Rabat (%)
                </label>
                <input
                  type="number"
                  name="discount_percent"
                  value={formData.discount_percent ?? ''}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. 10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Kod rabatowy
                </label>
                <input
                  type="text"
                  name="discount_code"
                  value={formData.discount_code}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. PROMO10"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Miniaturka (URL)
                </label>
                <input
                  type="text"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Link do produktu
                </label>
                <input
                  type="text"
                  name="external_url"
                  value={formData.external_url}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {/* Contractor-specific fields */}
          {isContractor && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Cena za usługę (zł)
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price ?? ''}
                  onChange={handleChange}
                  step={0.01}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. 2000.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-1">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. 123 456 789"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-tertiary mb-1">Adres</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  placeholder="np. ul. Przykładowa 10, Warszawa"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-tertiary mb-1">
                  Załącznik (oferta, umowa)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-tertiary hover:bg-surface-hover transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {formData.attachment ? 'Zmień plik' : 'Wybierz plik'}
                  </button>
                  {formData.attachment && (
                    <span className="text-sm text-text-tertiary truncate max-w-[200px]">
                      {formData.attachment.name}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Status - for product and contractor only */}
          {!isNote && (
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              >
                {SYSTEM_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes - for product and contractor only */}
          {!isNote && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-tertiary mb-1">Notatki</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl border border-border-hover bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                placeholder="Dodatkowe informacje..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setFormData(getDefaultFormData(itemType));
              onClose();
            }}
            className="inline-flex items-center rounded-full border border-border-hover bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Dodawanie...' : isNote ? 'Dodaj notatkę' : isContractor ? 'Dodaj wykonawcę' : 'Dodaj produkt'}
          </button>
        </div>
      </form>
    </div>
  );
}
