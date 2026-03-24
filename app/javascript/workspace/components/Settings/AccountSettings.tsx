import { useState, useRef, useEffect } from 'react';
import {
  useCurrentUser,
  useUpdateProfile,
  useUpdatePassword,
  useUploadAvatar,
  useDeleteAvatar,
} from '../../hooks/useUser';
import type { UpdateProfileInput, UpdatePasswordInput } from '../../types';

export default function AccountSettings() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  // Profile form state (without company_name - moved to Documents tab)
  const [profileForm, setProfileForm] = useState<Omit<UpdateProfileInput, 'company_name'>>({
    first_name: '',
    last_name: '',
    phone: '',
    title: '',
  });
  const [profileInitialized, setProfileInitialized] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<UpdatePasswordInput>({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when user data loads
  useEffect(() => {
    if (user && !profileInitialized) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        title: user.title || '',
      });
      setProfileInitialized(true);
    }
  }, [user, profileInitialized]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    try {
      await updateProfile.mutateAsync(profileForm);
      setProfileMessage({ type: 'success', text: 'Profil został zaktualizowany' });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Wystąpił błąd' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordMessage({ type: 'error', text: 'Hasła nie są zgodne' });
      return;
    }

    try {
      await updatePassword.mutateAsync(passwordForm);
      setPasswordMessage({ type: 'success', text: 'Hasło zostało zmienione' });
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Wystąpił błąd' });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error: any) {
      alert(error.message || 'Nie udało się przesłać zdjęcia');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Czy na pewno chcesz usunąć zdjęcie profilowe?')) return;

    try {
      await deleteAvatar.mutateAsync();
    } catch (error: any) {
      alert(error.message || 'Nie udało się usunąć zdjęcia');
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Zdjęcie profilowe</h2>

        <div className="flex items-center gap-6">
          {/* Avatar preview */}
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-surface-inset flex items-center justify-center text-2xl font-bold text-text-tertiary">
                {user?.initials}
              </div>
            )}
          </div>

          {/* Upload/Delete buttons */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-border-hover bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {uploadAvatar.isPending ? 'Przesyłanie...' : 'Zmień zdjęcie'}
            </button>

            {user?.avatar_url && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={deleteAvatar.isPending}
                className="block text-sm text-red-600 dark:text-red-400 hover:text-red-700"
              >
                Usuń zdjęcie
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Dane osobowe</h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-text-secondary mb-1">
                Imię
              </label>
              <input
                type="text"
                id="first_name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Jan"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-text-secondary mb-1">
                Nazwisko
              </label>
              <input
                type="text"
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Kowalski"
              />
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
              Stanowisko
            </label>
            <input
              type="text"
              id="title"
              value={profileForm.title}
              onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="np. Projektant wnętrz"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">
              Telefon
            </label>
            <input
              type="tel"
              id="phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+48 123 456 789"
            />
          </div>

          {profileMessage && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                profileMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </form>
      </section>

      {/* Email Section (read-only info) */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Adres e-mail</h2>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">E-mail</label>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="flex-1 rounded-xl border border-border bg-surface-hover px-4 py-2.5 text-sm text-text-tertiary"
            />
            <span className="text-xs text-text-muted">Skontaktuj się z nami, aby zmienić adres e-mail</span>
          </div>
        </div>
      </section>

      {/* Password Section */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Zmiana hasła</h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-text-secondary mb-1">
              Aktualne hasło
            </label>
            <input
              type="password"
              id="current_password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Nowe hasło
            </label>
            <input
              type="password"
              id="password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-text-secondary mb-1">
              Powtórz nowe hasło
            </label>
            <input
              type="password"
              id="password_confirmation"
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              minLength={6}
            />
          </div>

          {passwordMessage && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                passwordMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={updatePassword.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {updatePassword.isPending ? 'Zmienianie...' : 'Zmień hasło'}
          </button>
        </form>
      </section>
    </div>
  );
}
