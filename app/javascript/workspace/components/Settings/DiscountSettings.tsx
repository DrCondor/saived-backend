import { useState } from 'react';
import type { Discount } from '../../types';
import { useCurrentUser, useUpdateDiscounts } from '../../hooks/useUser';

const MAX_DISCOUNTS = 20;

interface EditingDiscount {
  id: string;
  domain: string;
  percentage: number;
  code: string;
}

export default function DiscountSettings() {
  const { data: user } = useCurrentUser();
  const updateDiscounts = useUpdateDiscounts();

  const [editingDiscount, setEditingDiscount] = useState<EditingDiscount | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const discounts = user?.discounts || [];
  const canAddMore = discounts.length < MAX_DISCOUNTS;

  const normalizeDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  };

  const handleSaveDiscount = async () => {
    if (!editingDiscount) return;

    setMessage(null);

    const normalizedDomain = normalizeDomain(editingDiscount.domain);

    if (!normalizedDomain) {
      setMessage({ type: 'error', text: 'Domena jest wymagana' });
      return;
    }

    if (editingDiscount.percentage < 0 || editingDiscount.percentage > 100) {
      setMessage({ type: 'error', text: 'Procent musi byc miedzy 0 a 100' });
      return;
    }

    // Check for duplicate domain (excluding current one when editing)
    const isDuplicate = discounts.some(
      (d) => d.domain === normalizedDomain && d.id !== editingDiscount.id
    );
    if (isDuplicate) {
      setMessage({ type: 'error', text: `Rabat dla domeny ${normalizedDomain} juz istnieje` });
      return;
    }

    try {
      let newDiscounts: Discount[];

      if (isAddingNew) {
        newDiscounts = [
          ...discounts,
          {
            id: editingDiscount.id,
            domain: normalizedDomain,
            percentage: editingDiscount.percentage,
            code: editingDiscount.code.trim() || null,
          },
        ];
      } else {
        newDiscounts = discounts.map((d) =>
          d.id === editingDiscount.id
            ? {
                ...d,
                domain: normalizedDomain,
                percentage: editingDiscount.percentage,
                code: editingDiscount.code.trim() || null,
              }
            : d
        );
      }

      await updateDiscounts.mutateAsync(newDiscounts);
      setMessage({ type: 'success', text: isAddingNew ? 'Rabat zostal dodany' : 'Rabat zostal zaktualizowany' });
      setEditingDiscount(null);
      setIsAddingNew(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Usunac ten rabat?')) {
      return;
    }

    setMessage(null);

    try {
      const newDiscounts = discounts.filter((d) => d.id !== discountId);
      await updateDiscounts.mutateAsync(newDiscounts);
      setMessage({ type: 'success', text: 'Rabat zostal usuniety' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  const startAddingNew = () => {
    setEditingDiscount({
      id: `discount_${Date.now()}`,
      domain: '',
      percentage: 10,
      code: '',
    });
    setIsAddingNew(true);
  };

  const startEditing = (discount: Discount) => {
    setEditingDiscount({
      id: discount.id,
      domain: discount.domain,
      percentage: discount.percentage,
      code: discount.code || '',
    });
    setIsAddingNew(false);
  };

  const cancelEditing = () => {
    setEditingDiscount(null);
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Discounts list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700">
            Twoje rabaty ({discounts.length}/{MAX_DISCOUNTS})
          </h3>
        </div>

        {discounts.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-200 mb-4">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-700">{discount.domain}</span>
                  {discount.code && (
                    <span className="ml-2 text-xs text-neutral-400">({discount.code})</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-emerald-600">-{discount.percentage}%</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(discount)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    title="Edytuj"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDiscount(discount.id)}
                    disabled={updateDiscounts.isPending}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Usun"
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
                </div>
              </div>
            ))}
          </div>
        )}

        {discounts.length === 0 && !editingDiscount && (
          <p className="text-sm text-neutral-400 mb-4">Nie masz jeszcze zadnych rabatow.</p>
        )}

        {/* Edit/Add form */}
        {editingDiscount && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">
              {isAddingNew ? 'Nowy rabat' : 'Edytuj rabat'}
            </h4>

            <div className="space-y-4">
              {/* Domain */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Domena sklepu</label>
                <input
                  type="text"
                  value={editingDiscount.domain}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, domain: e.target.value })}
                  placeholder="np. ikea.pl"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Podaj nazwe domeny bez https:// i www.
                </p>
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Procent rabatu</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingDiscount.percentage}
                    onChange={(e) =>
                      setEditingDiscount({ ...editingDiscount, percentage: parseInt(e.target.value) || 0 })
                    }
                    className="w-24 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-sm text-neutral-600">%</span>
                </div>
              </div>

              {/* Code (optional) */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Kod rabatowy <span className="text-neutral-400">(opcjonalnie)</span>
                </label>
                <input
                  type="text"
                  value={editingDiscount.code}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value })}
                  placeholder="np. PROMO10"
                  maxLength={50}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Kod zostanie dodany do etykiety rabatu na produkcie
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveDiscount}
                  disabled={updateDiscounts.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {updateDiscounts.isPending ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add button */}
        {canAddMore && !editingDiscount && (
          <button
            type="button"
            onClick={startAddingNew}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj rabat
          </button>
        )}

        {!canAddMore && !editingDiscount && (
          <p className="text-xs text-neutral-400">Osiagnieto limit rabatow</p>
        )}
      </div>
    </div>
  );
}
