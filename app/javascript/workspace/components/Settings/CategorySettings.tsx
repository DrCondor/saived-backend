import { useState } from 'react';
import type { CustomCategory } from '../../types';
import { CATEGORIES } from '../../utils/categoryHelpers';
import { useCurrentUser, useUpdateCustomCategories } from '../../hooks/useUser';

const MAX_CUSTOM_CATEGORIES = 10;

interface EditingCategory {
  id: string;
  name: string;
}

export default function CategorySettings() {
  const { data: user } = useCurrentUser();
  const updateCategories = useUpdateCustomCategories();

  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const customCategories = user?.custom_categories || [];
  const canAddMore = customCategories.length < MAX_CUSTOM_CATEGORIES;

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    setMessage(null);

    if (!editingCategory.name.trim()) {
      setMessage({ type: 'error', text: 'Nazwa kategorii jest wymagana' });
      return;
    }

    try {
      let newCategories: CustomCategory[];

      if (isAddingNew) {
        newCategories = [
          ...customCategories,
          {
            id: editingCategory.id,
            name: editingCategory.name.trim(),
          },
        ];
      } else {
        newCategories = customCategories.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: editingCategory.name.trim() }
            : c
        );
      }

      await updateCategories.mutateAsync(newCategories);
      setMessage({ type: 'success', text: isAddingNew ? 'Kategoria zostala dodana' : 'Kategoria zostala zaktualizowana' });
      setEditingCategory(null);
      setIsAddingNew(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Usunac te kategorie? Produkty z ta kategoria zostana zmienione na "BRAK".')) {
      return;
    }

    setMessage(null);

    try {
      const newCategories = customCategories.filter((c) => c.id !== categoryId);
      await updateCategories.mutateAsync(newCategories);
      setMessage({ type: 'success', text: 'Kategoria zostala usunieta' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  const startAddingNew = () => {
    setEditingCategory({
      id: `custom_cat_${Date.now()}`,
      name: '',
    });
    setIsAddingNew(true);
  };

  const startEditing = (category: CustomCategory) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
    });
    setIsAddingNew(false);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setIsAddingNew(false);
  };

  // System categories (skip the first "BRAK" entry)
  const systemCategories = CATEGORIES.filter((c) => c.id !== '');

  return (
    <div className="space-y-6">
      {/* System categories */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Kategorie systemowe</h3>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 divide-y divide-neutral-200">
          {systemCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-4 px-4 py-3">
              <span className="flex-1 text-sm font-medium text-neutral-700">{category.label}</span>
            </div>
          ))}
        </div>
      </div>

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

      {/* Custom categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700">
            Twoje kategorie ({customCategories.length}/{MAX_CUSTOM_CATEGORIES})
          </h3>
        </div>

        {customCategories.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-200 mb-4">
            {customCategories.map((category) => (
              <div key={category.id} className="flex items-center gap-4 px-4 py-3">
                <span className="flex-1 text-sm font-medium text-neutral-700">{category.name.toUpperCase()}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(category)}
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
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={updateCategories.isPending}
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

        {/* Edit/Add form */}
        {editingCategory && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">
              {isAddingNew ? 'Nowa kategoria' : 'Edytuj kategorie'}
            </h4>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Nazwa</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCategory();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  placeholder="np. PODŁOGI"
                  maxLength={30}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={updateCategories.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {updateCategories.isPending ? 'Zapisywanie...' : 'Zapisz'}
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
        {canAddMore && !editingCategory && (
          <button
            type="button"
            onClick={startAddingNew}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj wlasna kategorie
          </button>
        )}

        {!canAddMore && !editingCategory && (
          <p className="text-xs text-neutral-400">Osiagnieto limit wlasnych kategorii</p>
        )}
      </div>
    </div>
  );
}
