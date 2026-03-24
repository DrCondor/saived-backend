import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useUser';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header() {
  const { data: user } = useCurrentUser();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Check if we're on a non-project page (like settings)
  const isOnProjectsPage = location.pathname === '/workspace' ||
                           location.pathname.startsWith('/workspace/projects');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copyText, setCopyText] = useState('Kopiuj');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCopyToken = async () => {
    if (user?.api_token) {
      await navigator.clipboard.writeText(user.api_token);
      setCopyText('Skopiowano!');
      setTimeout(() => setCopyText('Kopiuj'), 1500);
    }
  };

  if (!user) return null;

  const handleLogout = () => {
    // Create a form and submit it to logout (Rails needs DELETE method + CSRF)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/users/sign_out';

    const methodInput = document.createElement('input');
    methodInput.type = 'hidden';
    methodInput.name = '_method';
    methodInput.value = 'DELETE';

    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'authenticity_token';
    csrfInput.value =
      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
      '';

    form.appendChild(methodInput);
    form.appendChild(csrfInput);
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <header className="border-b border-border bg-surface-header backdrop-blur sticky top-0 z-40">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/workspace" className="flex items-center gap-3">
            <div className="rounded-lg overflow-hidden dark:ring-1 dark:ring-white/10">
              <img
                src="/images/saived-logo.jpg"
                alt="SAIVED"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight text-sm sm:text-base">
                SAIVED
              </span>
              <span className="text-[10px] text-text-muted tracking-wide uppercase hidden sm:block">
                Design More. Manage Less.
              </span>
            </div>
          </Link>

          {/* Back to projects link - shown when not on projects page */}
          {!isOnProjectsPage && (
            <Link
              to="/workspace"
              className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Projekty</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={theme === 'light' ? 'Włącz tryb ciemny' : 'Włącz tryb jasny'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-border bg-surface pl-3 pr-2 py-1.5 text-sm hover:bg-surface-hover transition-colors"
            >
              <span className="text-text-tertiary hidden sm:inline truncate max-w-[160px]">
                {user.display_name}
              </span>
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="h-7 w-7 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-800 text-xs font-medium flex items-center justify-center">
                  {user.initials}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-surface rounded-xl shadow-lg dark:shadow-none dark:ring-1 dark:ring-border border border-border py-2 z-50">
                {/* User info */}
                <div className="px-4 py-2 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-800 text-sm font-medium flex items-center justify-center">
                        {user.initials}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {user.display_name}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Settings link */}
                <Link
                  to="/workspace/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover"
                >
                  <svg
                    className="w-4 h-4 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Ustawienia
                </Link>

                {/* Extension download link */}
                <Link
                  to="/workspace/extension"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover"
                >
                  <svg
                    className="w-4 h-4 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                  Pobierz wtyczkę
                </Link>

                {/* API Token */}
                <div className="px-4 py-2 border-t border-border-subtle mt-1">
                  <p className="text-xs font-medium text-text-tertiary mb-1">
                    Token API (dla rozszerzenia)
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-surface-muted px-2 py-1 rounded font-mono truncate select-all">
                      {user.api_token}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="text-xs text-text-tertiary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-muted"
                    >
                      {copyText}
                    </button>
                  </div>
                </div>

                {/* Logout */}
                <div className="border-t border-border-subtle mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Wyloguj się
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
