import { useState, useRef, useEffect } from 'react';
import {
  useCurrentUser,
  useUpdateProfile,
  useUploadCompanyLogo,
  useDeleteCompanyLogo,
} from '../../hooks/useUser';

export default function DocumentSettings() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadCompanyLogo = useUploadCompanyLogo();
  const deleteCompanyLogo = useDeleteCompanyLogo();

  const [companyName, setCompanyName] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when user data loads
  useEffect(() => {
    if (user && !initialized) {
      setCompanyName(user.company_name || '');
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadCompanyLogo.mutateAsync(file);
    } catch (error: any) {
      alert(error.message || 'Nie udalo sie przeslac logo');
    }
  };

  const handleDeleteCompanyLogo = async () => {
    if (!confirm('Czy na pewno chcesz usunac logo firmy?')) return;

    try {
      await deleteCompanyLogo.mutateAsync();
    } catch (error: any) {
      alert(error.message || 'Nie udalo sie usunac logo');
    }
  };

  const handleSaveCompanyName = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await updateProfile.mutateAsync({ company_name: companyName });
      setMessage({ type: 'success', text: 'Nazwa firmy zostala zapisana' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystapil blad' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Logo Section */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Logo firmy</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Logo bedzie widoczne na wszystkich generowanych kosztorysach PDF.
        </p>

        <div className="flex items-center gap-6">
          {/* Logo preview */}
          <div className="relative">
            {user?.company_logo_url ? (
              <img
                src={user.company_logo_url}
                alt="Logo firmy"
                className="h-20 max-w-[160px] object-contain border border-neutral-200 rounded-lg p-2 bg-white"
              />
            ) : (
              <div className="w-32 h-20 rounded-lg bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Upload/Delete buttons */}
          <div className="space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleCompanyLogoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadCompanyLogo.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {uploadCompanyLogo.isPending ? 'Przesylanie...' : 'Wybierz logo'}
            </button>

            {user?.company_logo_url && (
              <button
                type="button"
                onClick={handleDeleteCompanyLogo}
                disabled={deleteCompanyLogo.isPending}
                className="block text-sm text-red-600 hover:text-red-700"
              >
                Usun logo
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Zalecany format: PNG lub JPG, max 2MB.
        </p>
      </section>

      {/* Company Name Section */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Nazwa firmy</h2>

        <form onSubmit={handleSaveCompanyName} className="space-y-4">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-neutral-700 mb-1">
              Nazwa wyswietlana na dokumentach
            </label>
            <input
              type="text"
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="np. Studio Wnetrz ABC"
            />
          </div>

          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </form>
      </section>
    </div>
  );
}
