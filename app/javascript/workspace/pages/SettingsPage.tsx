import { useState } from 'react';
import { useCurrentUser } from '../hooks/useUser';
import AccountSettings from '../components/Settings/AccountSettings';
import StatusSettings from '../components/Settings/StatusSettings';

type SettingsTab = 'account' | 'personalization';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'account',
    label: 'Konto',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: 'personalization',
    label: 'Personalizacja',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const { isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <header className="mb-6">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 mb-1">
          Ustawienia
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Twoje konto</h1>
      </header>

      {/* Main content with sidebar */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-neutral-700' : 'text-neutral-400'}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0 max-w-3xl">
          {activeTab === 'account' && <AccountSettings />}
          {activeTab === 'personalization' && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Statusy produktow</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Statusy pomagaja organizowac produkty w projektach. Mozesz dodac do 3 wlasnych statusow.
                </p>
                <StatusSettings />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
