import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useUser';

export default function Header() {
  const { data: user } = useCurrentUser();
  const location = useLocation();

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
    <header className="border-b border-neutral-200/70 bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/workspace" className="flex items-center gap-3">
            <img
              src="/assets/saived-logo.jpg"
              alt="SAIVED"
              className="h-9 w-9 object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight text-sm sm:text-base">
                SAIVED
              </span>
              <span className="text-[10px] text-neutral-400 tracking-wide uppercase hidden sm:block">
                Design More. Manage Less.
              </span>
            </div>
          </Link>

          {/* Back to projects link - shown when not on projects page */}
          {!isOnProjectsPage && (
            <Link
              to="/workspace"
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Projekty</span>
            </Link>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white pl-3 pr-2 py-1.5 text-sm hover:bg-neutral-50 transition-colors"
          >
            <span className="text-neutral-600 hidden sm:inline truncate max-w-[160px]">
              {user.display_name}
            </span>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="h-7 w-7 rounded-full bg-neutral-800 text-white text-xs font-medium flex items-center justify-center">
                {user.initials}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
              {/* User info */}
              <div className="px-4 py-2 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="h-10 w-10 rounded-full bg-neutral-800 text-white text-sm font-medium flex items-center justify-center">
                      {user.initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {user.display_name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Settings link */}
              <Link
                to="/workspace/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Ustawienia konta
              </Link>

              {/* API Token */}
              <div className="px-4 py-2 border-t border-neutral-100 mt-1">
                <p className="text-xs font-medium text-neutral-500 mb-1">
                  Token API (dla rozszerzenia)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-neutral-100 px-2 py-1 rounded font-mono truncate select-all">
                    {user.api_token}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
                  >
                    {copyText}
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-neutral-100 mt-1 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
    </header>
  );
}
