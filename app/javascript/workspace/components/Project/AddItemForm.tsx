import { useState } from 'react';
import type { CreateItemInput } from '../../types';
import { SYSTEM_STATUSES } from '../../utils/statusHelpers';

interface AddItemFormProps {
  onSubmit: (data: CreateItemInput) => void;
  isSubmitting?: boolean;
}

const defaultFormData: CreateItemInput = {
  name: '',
  quantity: 1,
  status: 'bez_statusu',
  unit_price: undefined,
  dimensions: '',
  category: '',
  discount_label: '',
  thumbnail_url: '',
  external_url: '',
  note: '',
};

export default function AddItemForm({ onSubmit, isSubmitting }: AddItemFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateItemInput>(defaultFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(defaultFormData);
    setIsOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-neutral-300 py-3 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm font-medium">Dodaj pozycje</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Nazwa produktu
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="np. Szafka nocna IKEA MALM"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Ilosc</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min={1}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Cena (zl)
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price ?? ''}
                  onChange={handleChange}
                  step={0.01}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="np. 250.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Wymiary</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="np. 120x60x40 cm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Kategoria</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="np. meble, oswietlenie"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  {SYSTEM_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Rabat / kod
                </label>
                <input
                  type="text"
                  name="discount_label"
                  value={formData.discount_label}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="-5% (KOD: MAJ24)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Miniaturka (URL)
                </label>
                <input
                  type="text"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Link do produktu
                </label>
                <input
                  type="text"
                  name="external_url"
                  value={formData.external_url}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-600 mb-1">Notatki</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="Dodatkowe informacje..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(defaultFormData);
                  setIsOpen(false);
                }}
                className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Dodawanie...' : 'Dodaj pozycje'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
