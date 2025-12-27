import { Link, useNavigate } from 'react-router-dom';
import type { ProjectListItem, Project } from '../../types';

interface SidebarProps {
  projects: ProjectListItem[];
  currentProjectId: number | null;
  currentProject?: Project | null;
  onCreateProject?: () => void;
}

export default function Sidebar({
  projects,
  currentProjectId,
  currentProject,
  onCreateProject,
}: SidebarProps) {
  const navigate = useNavigate();

  const handleNewProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      navigate('/workspace/projects/new');
    }
  };

  return (
    <aside className="w-72 shrink-0">
      <div className="sticky top-24">
        <div className="rounded-3xl bg-neutral-100/80 border border-neutral-200/50 px-4 py-5">
          {/* New project button */}
          <div className="mb-6">
            <button
              onClick={handleNewProject}
              className="flex items-center justify-center gap-2 w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 transition-colors shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nowy projekt
            </button>
          </div>

          {/* Projects list */}
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                Projekty
              </p>

              <div className="space-y-1">
                {projects.map((project) => {
                  const active = currentProjectId === project.id;

                  return (
                    <div
                      key={project.id}
                      className={`rounded-2xl ${
                        active
                          ? 'bg-white shadow-sm border border-neutral-200/80'
                          : 'hover:bg-white/60'
                      } transition-all`}
                    >
                      <Link
                        to={`/workspace/projects/${project.id}`}
                        className="block px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900 truncate">
                            {project.name || 'Bez nazwy'}
                          </span>
                          {active && (
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
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(project.created_at).toLocaleDateString(
                            'pl-PL'
                          )}
                        </span>
                      </Link>

                      {/* Nested sections for active project */}
                      {active && currentProject && currentProject.sections.length > 0 && (
                        <div className="px-3 pb-2.5 space-y-0.5">
                          {currentProject.sections.map((section) => (
                            <a
                              key={section.id}
                              href={`#section-${section.id}`}
                              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                              <span className="truncate">{section.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {projects.length === 0 && (
                  <p className="px-3 py-2 text-xs text-neutral-400">
                    Brak projektów. Utwórz pierwszy!
                  </p>
                )}
              </div>
            </div>

            {/* Future sections */}
            <div className="pt-4 border-t border-neutral-200/50">
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                Ulubione
              </p>
              <p className="text-[11px] text-neutral-400 italic">wkrótce...</p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                Ustawienia
              </p>
              <p className="text-[11px] text-neutral-400 italic">wkrótce...</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
