import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ExtensionUpdateModalProps {
  onDismiss: () => void;
  isLoading?: boolean;
}

export default function ExtensionUpdateModal({
  onDismiss,
  isLoading = false,
}: ExtensionUpdateModalProps) {
  const [browser, setBrowser] = useState<'chrome' | 'firefox'>('chrome');

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {/* Puzzle piece icon */}
              <svg
                className="w-6 h-6"
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
            </div>
            <div>
              <h2 className="text-lg font-bold">Nowa wersja wtyczki!</h2>
              <p className="text-emerald-100 text-sm">Aktualizacja dostępna</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-neutral-600">
            Dostępna jest nowa wersja rozszerzenia SAIVED z poprawkami i ulepszeniami.
          </p>

          {/* Browser switcher */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBrowser('chrome')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                browser === 'chrome'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {/* Chrome icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.229-9.606zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z" />
              </svg>
              Chrome
            </button>
            <button
              type="button"
              onClick={() => setBrowser('firefox')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                browser === 'firefox'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {/* Firefox icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 5.235c.376.376.72.784 1.027 1.217-.484-.155-1.015-.176-1.55-.051-.7-1.198-1.656-1.478-2.607-1.478-.383 0-.773.063-1.136.194-.317.114-.527.188-.773.188-.18 0-.384-.045-.635-.12.3-.474.714-.874 1.203-1.153.622-.354 1.34-.532 2.075-.532.798 0 1.574.243 2.396.735zM6.392 6.392A8.962 8.962 0 0 1 12 4c.993 0 1.95.162 2.848.462-1.063.448-1.896 1.335-2.344 2.394-.224-.049-.455-.075-.693-.075-1.654 0-3.073 1.056-3.598 2.53-.213.593-.267 1.23-.172 1.843.047.304.127.596.236.871-1.562-.614-2.737-1.937-3.145-3.573a5.98 5.98 0 0 1 1.26-2.06zm-.896 9.112c-.323-.814-.496-1.7-.496-2.624 0-.447.042-.884.122-1.307.538 1.573 1.717 2.848 3.244 3.455.027.306.086.608.178.9.105.333.247.647.417.936-1.358-.154-2.573-.696-3.465-1.36zm9.324 3.068c-.914.581-1.994.918-3.15.918-1.66 0-3.173-.67-4.264-1.757.715.127 1.465.106 2.19-.078.826-.21 1.57-.617 2.173-1.155.586-.524 1.044-1.19 1.32-1.943.273.39.618.72 1.016.967.596.37 1.297.575 2.023.575.253 0 .502-.026.746-.075a5.957 5.957 0 0 1-2.054 2.548z" />
              </svg>
              Firefox
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Jak zaktualizować:</h3>

            {/* Chrome instructions */}
            {browser === 'chrome' && (
              <ol className="space-y-2.5">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    1
                  </span>
                  <p className="text-sm text-neutral-700">
                    Pobierz nowy plik ZIP poniżej
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    2
                  </span>
                  <p className="text-sm text-neutral-700">
                    <strong>Rozpakuj</strong> archiwum do wybranego folderu
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    3
                  </span>
                  <p className="text-sm text-neutral-700">
                    Otwórz{' '}
                    <code className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 text-xs font-mono">
                      chrome://extensions
                    </code>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    4
                  </span>
                  <p className="text-sm text-neutral-700">
                    Znajdź SAIVED i kliknij <strong>„Usuń"</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    5
                  </span>
                  <p className="text-sm text-neutral-700">
                    Kliknij <strong>„Załaduj rozpakowane"</strong> i wybierz folder
                  </p>
                </li>
              </ol>
            )}

            {/* Firefox instructions */}
            {browser === 'firefox' && (
              <ol className="space-y-2.5">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    1
                  </span>
                  <p className="text-sm text-neutral-700">
                    Pobierz nowy plik ZIP poniżej
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    2
                  </span>
                  <p className="text-sm text-neutral-700">
                    <strong>Rozpakuj</strong> archiwum do wybranego folderu
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    3
                  </span>
                  <p className="text-sm text-neutral-700">
                    Otwórz{' '}
                    <code className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 text-xs font-mono">
                      about:debugging#/runtime/this-firefox
                    </code>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    4
                  </span>
                  <p className="text-sm text-neutral-700">
                    Znajdź SAIVED i kliknij <strong>„Usuń"</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    5
                  </span>
                  <p className="text-sm text-neutral-700">
                    Kliknij <strong>„Załaduj tymczasowy dodatek..."</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    6
                  </span>
                  <p className="text-sm text-neutral-700">
                    Wybierz plik{' '}
                    <code className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 text-xs font-mono">
                      manifest.json
                    </code>{' '}
                    z folderu
                  </p>
                </li>
              </ol>
            )}
          </div>

          {/* Warning boxes */}
          {browser === 'chrome' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-amber-800">
                  <strong>Wskazówka:</strong> Przypnij wtyczkę do paska narzędzi klikając
                  ikonę puzzla i wybierając pin przy SAIVED.
                </p>
              </div>
            </div>
          )}

          {browser === 'firefox' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-amber-800">
                  <strong>Uwaga:</strong> Firefox wymaga ponownego załadowania wtyczki po
                  każdym restarcie przeglądarki. To ograniczenie tymczasowych dodatków.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            Później
          </button>
          <a
            href="/downloads/saived-extension.zip"
            download
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            {/* Download icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Pobierz ZIP
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
