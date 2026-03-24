import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateProject } from '../hooks/useProjects';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      { name: name.trim() || 'Nowy projekt', description: description.trim() || undefined },
      {
        onSuccess: (project) => {
          navigate(`/workspace/projects/${project.id}`);
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Powrót do projektów
        </Link>
      </div>

      <div className="rounded-3xl bg-surface border border-border p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Nowy projekt</h1>
        <p className="text-sm text-text-tertiary mb-8">
          Utwórz nowy projekt kosztorysowy dla swojego klienta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nazwa projektu
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              placeholder="np. Mieszkanie przy Marszałkowskiej"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Opis (opcjonalny)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              placeholder="Krótki opis projektu lub informacje o kliencie..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/workspace"
              className="inline-flex items-center rounded-full border border-border-hover bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {createProject.isPending ? (
                'Tworzenie...'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Utworz projekt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
