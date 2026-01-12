import { useState } from 'react';
import { useCurrentUser } from '../hooks/useUser';

type Browser = 'chrome' | 'firefox';

export default function ExtensionPage() {
  const { data: user, isLoading } = useCurrentUser();
  const [browser, setBrowser] = useState<Browser>('chrome');
  const [copyText, setCopyText] = useState('Kopiuj');

  const handleCopyToken = async () => {
    if (user?.api_token) {
      await navigator.clipboard.writeText(user.api_token);
      setCopyText('Skopiowano!');
      setTimeout(() => setCopyText('Kopiuj'), 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <header className="mb-8">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 mb-1">
          Rozszerzenie
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Pobierz wtyczke SAIVED
        </h1>
        <p className="text-neutral-500 mt-1">
          Zbieraj produkty ze sklepow internetowych jednym kliknieciem
        </p>
      </header>

      <div className="space-y-8">
        {/* Download Section */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-start gap-4">
            {/* Extension icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900 mb-1">
                Wtyczka SAIVED
              </h2>
              <p className="text-sm text-neutral-500 mb-4">
                Wersja 0.1.0 &middot; Kompatybilna z Chrome i Firefox
              </p>

              <a
                href="/downloads/saived-extension.zip"
                download="saived-extension.zip"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Pobierz wtyczke (ZIP)
              </a>
            </div>
          </div>
        </section>

        {/* Installation Instructions Section */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Instrukcja instalacji
          </h2>

          {/* Browser switcher */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setBrowser('chrome')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                browser === 'chrome'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm13.893 2.166l-3.953 6.848a5.454 5.454 0 0 1 0 6.892l3.953 6.848C22.019 21.609 24 17.094 24 12c0-.342-.012-.682-.035-1.018H13.824z" />
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
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.184 6.298c-.477-1.193-1.473-2.604-2.209-3.07.63 1.217.961 2.529 1.004 3.147.003.04.004.08.004.12a9.37 9.37 0 0 0-.329-1.427c-.692-2.076-2.202-3.477-2.769-3.944a10.263 10.263 0 0 0-2.295-1.498 9.626 9.626 0 0 0-5.21-.86c-.39.04-.78.104-1.163.19-.196.044-.39.094-.582.15a8.21 8.21 0 0 0-.48.159 8.83 8.83 0 0 0-.642.26l-.001.001c-.179.08-.355.166-.527.258a9.03 9.03 0 0 0-.87.527 9.37 9.37 0 0 0-2.42 2.39 8.718 8.718 0 0 0-.85 1.487c-.023.052-.044.105-.065.158-.015.04-.03.08-.044.12a6.93 6.93 0 0 0-.128.374 8.5 8.5 0 0 0-.306 1.257c-.028.159-.05.32-.068.48a8.94 8.94 0 0 0-.032.445 9.92 9.92 0 0 0-.004.425v.024a9.852 9.852 0 0 0 .083 1.216c.018.14.04.28.066.418a9.45 9.45 0 0 0 .26 1.114c.056.183.12.364.19.543.07.18.147.356.23.53a9.12 9.12 0 0 0 .553 1.003c.21.333.444.65.7.947.254.297.53.575.825.83.296.256.61.49.94.7a9.15 9.15 0 0 0 2.118 1.026c.38.132.77.236 1.168.31.398.075.804.12 1.213.137h.04c.135.005.27.008.406.008 4.984 0 9.054-3.858 9.418-8.75.004-.041.006-.082.008-.124.013-.167.02-.335.02-.505a9.26 9.26 0 0 0-.447-2.861z" />
              </svg>
              Firefox
            </button>
          </div>

          {/* Chrome Instructions */}
          {browser === 'chrome' && (
            <div className="space-y-4">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      <strong>Rozpakuj</strong> pobrany plik ZIP do wybranego folderu
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Otworz <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-xs font-mono">chrome://extensions</code> w przegladarce
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Wlacz <strong>&quot;Tryb dewelopera&quot;</strong> (przelacznik w prawym gornym rogu)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Kliknij <strong>&quot;Zaladuj rozpakowane&quot;</strong> (Load unpacked)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Wybierz folder z rozpakowana wtyczka
                    </p>
                  </div>
                </li>
              </ol>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mt-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    <strong>Wskazowka:</strong> Przypnij wtyczke do paska narzedzi klikajac ikone puzzla i wybierajac pin przy SAIVED.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Firefox Instructions */}
          {browser === 'firefox' && (
            <div className="space-y-4">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      <strong>Rozpakuj</strong> pobrany plik ZIP do wybranego folderu
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Otworz <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-xs font-mono">about:debugging#/runtime/this-firefox</code>
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Kliknij <strong>&quot;Zaladuj tymczasowy dodatek...&quot;</strong> (Load Temporary Add-on)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <p className="text-sm text-neutral-700">
                      Wybierz plik <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-xs font-mono">manifest.json</code> z rozpakowanego folderu
                    </p>
                  </div>
                </li>
              </ol>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mt-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    <strong>Uwaga:</strong> Firefox wymaga ponownego zaladowania wtyczki po kazdym restarcie przegladarki. To ograniczenie tymczasowych dodatkow.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Post-installation Section */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Po instalacji
          </h2>

          <ol className="space-y-3 mb-6">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                1
              </span>
              <p className="text-sm text-neutral-700">
                Kliknij ikone wtyczki SAIVED w pasku przegladarki
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                2
              </span>
              <p className="text-sm text-neutral-700">
                Wklej swoj token API (skopiuj go ponizej)
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                3
              </span>
              <p className="text-sm text-neutral-700">
                <strong>Gotowe!</strong> Mozesz teraz zbierac produkty ze sklepow
              </p>
            </li>
          </ol>

          {/* Token display */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Twoj token API
            </label>
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-mono text-neutral-600 truncate">
                {user?.api_token}
              </code>
              <button
                type="button"
                onClick={handleCopyToken}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copyText}
              </button>
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Potrzebujesz pomocy?
          </h2>
          <p className="text-sm text-neutral-500">
            Jesli masz pytania lub problemy z instalacja, napisz do nas na{' '}
            <a href="mailto:support@saived.ai" className="text-emerald-600 hover:text-emerald-700 font-medium">
              support@saived.ai
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
