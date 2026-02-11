import { useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useProject } from '../hooks/useProject';
import Sidebar from '../components/Layout/Sidebar';
import ProjectView from '../components/Project/ProjectView';
import { UndoRedoProvider } from '../contexts/UndoRedoContext';

export default function WorkspacePage() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentProjectId = projectId ? parseInt(projectId, 10) : null;

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: currentProject, isLoading: projectLoading } = useProject(currentProjectId);

  // If no project selected and we have projects, redirect to the first one
  useEffect(() => {
    if (!currentProjectId && projects.length > 0 && !projectsLoading) {
      navigate(`/workspace/projects/${projects[0].id}`, { replace: true });
    }
  }, [currentProjectId, projects, projectsLoading, navigate]);

  // Scroll to section when URL has hash (e.g., #section-123)
  useEffect(() => {
    if (location.hash && currentProject) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, currentProject]);

  // Show loading state when projects are loading on /workspace route
  const isRedirecting = !currentProjectId && projects.length > 0 && !projectsLoading;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        currentProject={currentProject}
      />

      {/* Main content */}
      <section className="flex-1 min-w-0">
        {/* Loading projects on /workspace route */}
        {!currentProjectId && projectsLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        )}

        {/* Redirecting to first project */}
        {isRedirecting && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        )}

        {/* Loading specific project */}
        {projectLoading && currentProjectId && (
          <div className="flex items-center justify-center py-20">
            <div className="text-neutral-500">Ladowanie projektu...</div>
          </div>
        )}

        {currentProject && (
          <UndoRedoProvider activeProjectId={currentProjectId}>
            <ProjectView project={currentProject} />
          </UndoRedoProvider>
        )}

        {!currentProjectId && !projectsLoading && projects.length === 0 && (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">Brak projektow</h2>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">
        Utworz swoj pierwszy projekt, aby rozpoczac tworzenie kosztorysow dla klientow.
      </p>
      <Link
        to="/workspace/projects/new"
        className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Utworz pierwszy projekt
      </Link>
    </div>
  );
}
