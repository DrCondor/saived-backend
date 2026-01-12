import { useState } from 'react';
import type { CustomStatus } from '../../types';
import { SYSTEM_STATUSES, COLOR_PALETTE } from '../../utils/statusHelpers';
import { useCurrentUser, useUpdateCustomStatuses } from '../../hooks/useUser';

const MAX_CUSTOM_STATUSES = 3;

interface EditingStatus {
  id: string;
  name: string;
  color: string;
  include_in_sum: boolean;
}

export default function StatusSettings() {
  const { data: user } = useCurrentUser();
  const updateStatuses = useUpdateCustomStatuses();

  const [editingStatus, setEditingStatus] = useState<EditingStatus | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const customStatuses = user?.custom_statuses || [];
  const canAddMore = customStatuses.length < MAX_CUSTOM_STATUSES;

  // Get colors already used by custom statuses (for filtering available colors)
  const usedColors = customStatuses.map((s) => s.color);

  const handleSaveStatus = async () => {
    if (!editingStatus) return;

    setMessage(null);

    if (!editingStatus.name.trim()) {
      setMessage({ type: 'error', text: 'Nazwa statusu jest wymagana' });
      return;
    }

    try {
      let newStatuses: CustomStatus[];

      if (isAddingNew) {
        // Adding new status
        newStatuses = [
          ...customStatuses,
          {
            id: editingStatus.id,
            name: editingStatus.name.trim(),
            color: editingStatus.color,
            include_in_sum: editingStatus.include_in_sum,
          },
        ];
      } else {
        // Updating existing status
        newStatuses = customStatuses.map((s) =>
          s.id === editingStatus.id
            ? {
                ...s,
                name: editingStatus.name.trim(),
                color: editingStatus.color,
                include_in_sum: editingStatus.include_in_sum,
              }
            : s
        );
      }

      await updateStatuses.mutateAsync(newStatuses);
      setMessage({ type: 'success', text: isAddingNew ? 'Status zostal dodany' : 'Status zostal zaktualizowany' });
      setEditingStatus(null);
      setIsAddingNew(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (!confirm('Usunac ten status? Produkty z tym statusem zostana zmienione na "BEZ STATUSU".')) {
      return;
    }

    setMessage(null);

    try {
      const newStatuses = customStatuses.filter((s) => s.id !== statusId);
      await updateStatuses.mutateAsync(newStatuses);
      setMessage({ type: 'success', text: 'Status zostal usuniety' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  const startAddingNew = () => {
    // Find first available color
    const availableColor = COLOR_PALETTE.find((c) => !usedColors.includes(c.id))?.id || COLOR_PALETTE[0].id;

    setEditingStatus({
      id: `custom_${Date.now()}`,
      name: '',
      color: availableColor,
      include_in_sum: true,
    });
    setIsAddingNew(true);
  };

  const startEditing = (status: CustomStatus) => {
    setEditingStatus({
      id: status.id,
      name: status.name,
      color: status.color,
      include_in_sum: status.include_in_sum,
    });
    setIsAddingNew(false);
  };

  const cancelEditing = () => {
    setEditingStatus(null);
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-6">
      {/* System statuses */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Statusy systemowe</h3>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 divide-y divide-neutral-200">
          {SYSTEM_STATUSES.map((status) => (
            <div key={status.id} className="flex items-center gap-4 px-4 py-3">
              <span className={`w-4 h-4 rounded-full ${status.bgColor}`} />
              <span className="flex-1 text-sm font-medium text-neutral-700">{status.label}</span>
              <span className="text-xs text-neutral-400">
                {status.includeInSum ? 'wlicza do sumy' : 'nie wlicza do sumy'}
              </span>
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

      {/* Custom statuses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700">
            Twoje statusy ({customStatuses.length}/{MAX_CUSTOM_STATUSES})
          </h3>
        </div>

        {customStatuses.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-200 mb-4">
            {customStatuses.map((status) => {
              const colorConfig = COLOR_PALETTE.find((c) => c.id === status.color);

              return (
                <div key={status.id} className="flex items-center gap-4 px-4 py-3">
                  <span className={`w-4 h-4 rounded-full ${colorConfig?.bg || 'bg-neutral-500'}`} />
                  <span className="flex-1 text-sm font-medium text-neutral-700">{status.name.toUpperCase()}</span>
                  <span className="text-xs text-neutral-400">
                    {status.include_in_sum ? 'wlicza do sumy' : 'nie wlicza do sumy'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(status)}
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
                      onClick={() => handleDeleteStatus(status.id)}
                      disabled={updateStatuses.isPending}
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
              );
            })}
          </div>
        )}

        {/* Edit/Add form */}
        {editingStatus && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">
              {isAddingNew ? 'Nowy status' : 'Edytuj status'}
            </h4>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Nazwa</label>
                <input
                  type="text"
                  value={editingStatus.name}
                  onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                  placeholder="np. W REALIZACJI"
                  maxLength={30}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2">Kolor</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => {
                    const isUsed = usedColors.includes(color.id) && color.id !== editingStatus.color;
                    const isSelected = editingStatus.color === color.id;

                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => !isUsed && setEditingStatus({ ...editingStatus, color: color.id })}
                        disabled={isUsed}
                        className={`w-8 h-8 rounded-full ${color.bg} transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-neutral-900' : ''
                        } ${isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                        title={isUsed ? 'Kolor jest juz uzywany' : color.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Include in sum */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="include_in_sum"
                  checked={editingStatus.include_in_sum}
                  onChange={(e) => setEditingStatus({ ...editingStatus, include_in_sum: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="include_in_sum" className="text-sm text-neutral-700">
                  Wliczaj do sumy projektu
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={updateStatuses.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {updateStatuses.isPending ? 'Zapisywanie...' : 'Zapisz'}
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
        {canAddMore && !editingStatus && (
          <button
            type="button"
            onClick={startAddingNew}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj wlasny status
          </button>
        )}

        {!canAddMore && !editingStatus && (
          <p className="text-xs text-neutral-400">Osiagnieto limit wlasnych statusow</p>
        )}
      </div>
    </div>
  );
}
