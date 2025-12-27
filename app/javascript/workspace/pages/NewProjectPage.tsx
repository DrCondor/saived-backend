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
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Powrot do projektow
        </Link>
      </div>

      <div className="rounded-3xl bg-white border border-neutral-200 p-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Nowy projekt</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Utworz nowy projekt kosztorysowy dla swojego klienta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nazwa projektu
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="np. Mieszkanie przy Marszalkowskiej"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Opis (opcjonalny)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="Krotki opis projektu lub informacje o kliencie..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/workspace"
              className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
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
