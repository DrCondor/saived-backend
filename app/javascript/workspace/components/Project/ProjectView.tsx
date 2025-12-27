import type { Project } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCreateSection } from '../../hooks/useSections';
import Section from './Section';

interface ProjectViewProps {
  project: Project;
}

export default function ProjectView({ project }: ProjectViewProps) {
  const createSection = useCreateSection(project.id);

  const handleAddSection = () => {
    createSection.mutate({});
  };

  const sections = project.sections || [];

  return (
    <div>
      {/* Project header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 mb-1">
              Projekt
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{project.name}</h1>
            <p className="mt-2 flex items-center gap-2">
              <span className="text-sm text-neutral-500">Suma projektu:</span>
              <span className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-bold text-white">
                {formatCurrency(project.total_price)}
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Podglad PDF
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Znajdz
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              Sortuj
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtr
            </button>
          </div>
        </div>
      </header>

      {/* Sections */}
      {sections.map((section) => (
        <Section key={section.id} section={section} projectId={project.id} />
      ))}

      {/* Add section button */}
      <div className="mt-8 mb-16">
        <button
          type="button"
          onClick={handleAddSection}
          disabled={createSection.isPending}
          className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-neutral-300 py-6 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="font-medium">
            {createSection.isPending ? 'Dodawanie...' : 'Dodaj sekcje'}
          </span>
        </button>
      </div>
    </div>
  );
}
