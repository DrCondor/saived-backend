import { useState, useRef, useEffect } from 'react';
import {
  useCurrentUser,
  useUpdateOrganization,
  useUploadCompanyLogo,
  useDeleteCompanyLogo,
} from '../../hooks/useUser';
import RichTextEditor from './RichTextEditor';

export default function DocumentSettings() {
  const { data: user } = useCurrentUser();
  const updateOrganization = useUpdateOrganization();
  const uploadCompanyLogo = useUploadCompanyLogo();
  const deleteCompanyLogo = useDeleteCompanyLogo();

  const [companyName, setCompanyName] = useState('');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when user data loads
  useEffect(() => {
    if (user && !initialized) {
      const org = user.organization;
      setCompanyName(org?.name || user.company_name || '');
      setNip(org?.nip || '');
      setPhone(org?.phone || '');
      setCompanyInfo(org?.company_info || '');
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadCompanyLogo.mutateAsync(file);
    } catch (error: any) {
      alert(error.message || 'Nie udało się przesłać logo');
    }
  };

  const handleDeleteCompanyLogo = async () => {
    if (!confirm('Czy na pewno chcesz usunąć logo firmy?')) return;

    try {
      await deleteCompanyLogo.mutateAsync();
    } catch (error: any) {
      alert(error.message || 'Nie udało się usunąć logo');
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await updateOrganization.mutateAsync({
        name: companyName,
        nip: nip,
        phone: phone,
        company_info: companyInfo,
      });
      setMessage({ type: 'success', text: 'Dane organizacji zostały zapisane' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Wystąpił błąd' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Logo Section */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Logo firmy</h2>
        <p className="text-sm text-text-tertiary mb-4">
          Logo będzie widoczne na wszystkich generowanych kosztorysach PDF.
        </p>

        <div className="flex items-center gap-6">
          {/* Logo preview */}
          <div className="relative">
            {user?.company_logo_url ? (
              <img
                src={user.company_logo_url}
                alt="Logo firmy"
                className="h-20 max-w-[160px] object-contain border border-border rounded-lg p-2 bg-surface"
              />
            ) : (
              <div className="w-32 h-20 rounded-lg bg-surface-muted border-2 border-dashed border-border-hover flex items-center justify-center">
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="inline-flex items-center gap-2 rounded-full border border-border-hover bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {uploadCompanyLogo.isPending ? 'Przesyłanie...' : 'Wybierz logo'}
            </button>

            {user?.company_logo_url && (
              <button
                type="button"
                onClick={handleDeleteCompanyLogo}
                disabled={deleteCompanyLogo.isPending}
                className="block text-sm text-red-600 dark:text-red-400 hover:text-red-700"
              >
                Usuń logo
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          Zalecany format: PNG lub JPG, max 2MB.
        </p>
      </section>

      {/* Organization Details Section */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Dane organizacji</h2>

        <form onSubmit={handleSaveOrganization} className="space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-text-secondary mb-1">
              Nazwa firmy
            </label>
            <input
              type="text"
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="np. Studio Wnętrz ABC"
            />
          </div>

          {/* NIP */}
          <div>
            <label htmlFor="nip" className="block text-sm font-medium text-text-secondary mb-1">
              NIP
            </label>
            <input
              type="text"
              id="nip"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="np. 123-456-78-90"
              maxLength={13}
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Numer identyfikacji podatkowej wyświetlany na dokumentach.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="org_phone" className="block text-sm font-medium text-text-secondary mb-1">
              Telefon firmowy
            </label>
            <input
              type="tel"
              id="org_phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="np. +48 123 456 789"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Numer telefonu wyświetlany na dokumentach PDF.
            </p>
          </div>

          {/* Company Info (Rich Text) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Dodatkowe informacje
            </label>
            <p className="text-xs text-text-tertiary mb-2">
              Dodatkowy tekst widoczny w nagłówku dokumentów. Możesz używać formatowania.
            </p>
            <RichTextEditor
              value={companyInfo}
              onChange={setCompanyInfo}
              maxLength={500}
              placeholder="np. adres siedziby, godziny pracy, strona www..."
            />
          </div>

          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={updateOrganization.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {updateOrganization.isPending ? 'Zapisywanie...' : 'Zapisz dane organizacji'}
          </button>
        </form>
      </section>
    </div>
  );
}
