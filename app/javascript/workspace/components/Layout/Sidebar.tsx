import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { ProjectListItem, Project } from '../../types';
import { useToggleFavorite, useReorderProjects, useDeleteProject } from '../../hooks/useProjects';
import { formatCurrency } from '../../utils/formatters';

// localStorage functions for expanded projects state
const EXPANDED_SIDEBAR_PROJECTS_KEY = 'saived_sidebar_expanded_projects';

function getExpandedProjects(): Set<number> {
  try {
    const stored = localStorage.getItem(EXPANDED_SIDEBAR_PROJECTS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore localStorage errors
  }
  return new Set();
}

function saveExpandedProjects(projectIds: Set<number>) {
  try {
    localStorage.setItem(EXPANDED_SIDEBAR_PROJECTS_KEY, JSON.stringify([...projectIds]));
  } catch {
    // Ignore localStorage errors
  }
}

interface SidebarProps {
  projects: ProjectListItem[];
  currentProjectId: number | null;
  currentProject?: Project | null;
  onCreateProject?: () => void;
}

interface ProjectItemProps {
  project: ProjectListItem;
  isActive: boolean;
  isSectionsExpanded: boolean;
  onToggleSections: (projectId: number) => void;
  onContextMenu: (e: React.MouseEvent, projectId: number) => void;
  isDragging?: boolean;
}

function ProjectItem({
  project,
  isActive,
  isSectionsExpanded,
  onToggleSections,
  onContextMenu,
  isDragging = false,
}: ProjectItemProps) {
  const navigate = useNavigate();

  const handleSectionClick = (e: React.MouseEvent, sectionId: number) => {
    if (isActive) {
      // For active project, anchor link works normally
      return;
    }
    e.preventDefault();
    navigate(`/workspace/projects/${project.id}#section-${sectionId}`);
  };

  return (
    <div
      className={`group rounded-xl ${
        isActive
          ? 'bg-white shadow-sm border border-neutral-200/80'
          : 'hover:bg-white/60'
      } ${isDragging ? 'shadow-lg ring-2 ring-emerald-300' : ''} transition-all`}
      onContextMenu={(e) => onContextMenu(e, project.id)}
    >
      <div className="flex items-center gap-1 px-3 py-2.5">
        <Link
          to={`/workspace/projects/${project.id}`}
          className="flex items-center gap-2 flex-1 min-w-0 px-2"
          onClick={(e) => isDragging && e.preventDefault()}
        >
          {/* Favorite star */}
          {project.favorite && (
            <svg
              className="w-3.5 h-3.5 text-amber-400 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-neutral-900 truncate">
                {project.name || 'Bez nazwy'}
              </span>
              {/* Chevron button - show for ANY project with sections */}
              {project.sections.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSections(project.id);
                  }}
                  className="p-0.5 rounded hover:bg-neutral-100 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
                      !isSectionsExpanded ? '-rotate-90' : ''
                    }`}
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
                </button>
              )}
            </div>
            <span className="text-[11px] text-neutral-400">
              {formatCurrency(project.total_price)}
            </span>
          </div>
        </Link>
      </div>

      {/* Nested sections/groups - show for ANY expanded project */}
      {isSectionsExpanded && project.sections.length > 0 && (
        <div className="px-3 pb-2.5 space-y-0.5">
          {(() => {
            const groups = project.section_groups || [];
            const groupedSectionIds = new Set<number>();

            // Build group entries
            const groupEntries = groups.map((group) => {
              const groupSections = project.sections.filter((s) => s.section_group_id === group.id);
              groupSections.forEach((s) => groupedSectionIds.add(s.id));
              return { type: 'group' as const, group, sections: groupSections, position: group.position };
            });

            // Build standalone section entries
            const standaloneEntries = project.sections
              .filter((s) => !groupedSectionIds.has(s.id))
              .map((section) => ({ type: 'section' as const, section, position: section.position }));

            // Sort all entries by position
            const entries = [...groupEntries, ...standaloneEntries].sort((a, b) => a.position - b.position);

            return entries.map((entry) => {
              if (entry.type === 'group') {
                return (
                  <div key={`group-${entry.group.id}`}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className="truncate">{entry.group.name}</span>
                    </div>
                    {entry.sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#section-${section.id}`}
                        onClick={(e) => handleSectionClick(e, section.id)}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 pl-6 text-xs transition-colors ${
                          isActive
                            ? 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            : 'text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-neutral-300' : 'bg-neutral-300/70'}`} />
                        <span className="truncate">{section.name}</span>
                      </a>
                    ))}
                  </div>
                );
              }
              return (
                <a
                  key={entry.section.id}
                  href={`#section-${entry.section.id}`}
                  onClick={(e) => handleSectionClick(e, entry.section.id)}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      : 'text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-neutral-300' : 'bg-neutral-300/70'}`} />
                  <span className="truncate">{entry.section.name}</span>
                </a>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  projectId: number | null;
}

export default function Sidebar({
  projects,
  currentProjectId,
  currentProject,
  onCreateProject,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const toggleFavorite = useToggleFavorite();
  const reorderProjects = useReorderProjects();
  const deleteProject = useDeleteProject();

  // Local state for DnD
  const [localProjects, setLocalProjects] = useState(projects);

  // Expanded projects state (which projects have their sections visible)
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(() => getExpandedProjects());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    projectId: null,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.visible]);

  const handleNewProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      navigate('/workspace/projects/new');
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      projectId,
    });
  }, []);

  const handleToggleSections = useCallback((projectId: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      saveExpandedProjects(next);
      return next;
    });
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (contextMenu.projectId) {
      toggleFavorite.mutate(contextMenu.projectId);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [contextMenu.projectId, toggleFavorite]);

  const handleDeleteProject = useCallback(() => {
    if (contextMenu.projectId) {
      const project = projects.find((p) => p.id === contextMenu.projectId);
      if (project && confirm(`Usunąć projekt "${project.name}"?`)) {
        deleteProject.mutate(contextMenu.projectId);
        if (currentProjectId === contextMenu.projectId) {
          const remaining = projects.filter((p) => p.id !== contextMenu.projectId);
          if (remaining.length > 0) {
            navigate(`/workspace/projects/${remaining[0].id}`);
          } else {
            navigate('/workspace');
          }
        }
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [contextMenu.projectId, projects, deleteProject, currentProjectId, navigate]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const projectId = parseInt(draggableId.replace('project-', ''), 10);
    const project = localProjects.find((p) => p.id === projectId);
    if (!project) return;

    // Determine if moving between favorites and regular lists
    const sourceIsFavorites = source.droppableId === 'favorites';
    const destIsFavorites = destination.droppableId === 'favorites';

    // Get current lists
    const favoriteProjects = localProjects.filter((p) => p.favorite);
    const regularProjects = localProjects.filter((p) => !p.favorite);

    let newOrder: ProjectListItem[];

    if (sourceIsFavorites && destIsFavorites) {
      // Reorder within favorites
      const newFavorites = [...favoriteProjects];
      newFavorites.splice(source.index, 1);
      newFavorites.splice(destination.index, 0, project);
      newOrder = [...newFavorites, ...regularProjects];
    } else if (!sourceIsFavorites && !destIsFavorites) {
      // Reorder within regular
      const newRegular = [...regularProjects];
      newRegular.splice(source.index, 1);
      newRegular.splice(destination.index, 0, project);
      newOrder = [...favoriteProjects, ...newRegular];
    } else if (sourceIsFavorites && !destIsFavorites) {
      // Move from favorites to regular (unfavorite)
      const updatedProject = { ...project, favorite: false };
      const newFavorites = favoriteProjects.filter((p) => p.id !== projectId);
      const newRegular = [...regularProjects];
      newRegular.splice(destination.index, 0, updatedProject);
      newOrder = [...newFavorites, ...newRegular];
      // Also toggle favorite on backend
      toggleFavorite.mutate(projectId);
    } else {
      // Move from regular to favorites (favorite)
      const updatedProject = { ...project, favorite: true };
      const newRegular = regularProjects.filter((p) => p.id !== projectId);
      const newFavorites = [...favoriteProjects];
      newFavorites.splice(destination.index, 0, updatedProject);
      newOrder = [...newFavorites, ...newRegular];
      // Also toggle favorite on backend
      toggleFavorite.mutate(projectId);
    }

    setLocalProjects(newOrder);
    reorderProjects.mutate(newOrder.map((p) => p.id));
  }, [localProjects, reorderProjects, toggleFavorite]);

  // Split projects into favorites and regular
  const favoriteProjects = localProjects.filter((p) => p.favorite);
  const regularProjects = localProjects.filter((p) => !p.favorite);

  const contextMenuProject = contextMenu.projectId
    ? projects.find((p) => p.id === contextMenu.projectId)
    : null;

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

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              {/* Favorites section */}
              {favoriteProjects.length > 0 && (
                <div>
                  <p className="mb-3 px-1 text-[10px] font-bold tracking-[0.2em] uppercase text-amber-500 flex items-center gap-1.5">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Ulubione
                  </p>

                  <Droppable droppableId="favorites">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-1 min-h-[40px] rounded-xl transition-colors ${
                          snapshot.isDraggingOver ? 'bg-amber-50' : ''
                        }`}
                      >
                        {favoriteProjects.map((project, index) => (
                          <Draggable
                            key={project.id}
                            draggableId={`project-${project.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  cursor: 'default',
                                }}
                              >
                                <ProjectItem
                                  project={project}
                                  isActive={currentProjectId === project.id}
                                  isSectionsExpanded={expandedProjects.has(project.id)}
                                  onToggleSections={handleToggleSections}
                                  onContextMenu={handleContextMenu}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )}

              {/* All projects section */}
              <div>
                <p className="mb-3 px-1 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                  Projekty
                </p>

                <Droppable droppableId="projects">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-1 min-h-[40px] rounded-xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-emerald-50' : ''
                      }`}
                    >
                      {regularProjects.map((project, index) => (
                        <Draggable
                          key={project.id}
                          draggableId={`project-${project.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <ProjectItem
                                project={project}
                                isActive={currentProjectId === project.id}
                                isSectionsExpanded={expandedProjects.has(project.id)}
                                onToggleSections={handleToggleSections}
                                onContextMenu={handleContextMenu}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {localProjects.length === 0 && (
                  <p className="px-3 py-2 text-xs text-neutral-400">
                    Brak projektów. Utwórz pierwszy!
                  </p>
                )}
              </div>
            </div>
          </DragDropContext>

          {/* Favorites link */}
          <div className="mt-6 pt-4 border-t border-neutral-200/50">
            <Link
              to="/workspace/favorites"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                location.pathname === '/workspace/favorites'
                  ? 'bg-white shadow-sm text-rose-600 font-medium'
                  : 'text-neutral-500 hover:bg-white/50 hover:text-neutral-700'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Ulubione
            </Link>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu.visible && contextMenuProject && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] rounded-xl bg-white shadow-xl border border-neutral-200 py-1.5 overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleToggleFavorite}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            {contextMenuProject.favorite ? (
              <>
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Usuń z ulubionych
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Dodaj do ulubionych
              </>
            )}
          </button>

          <div className="h-px bg-neutral-100 my-1" />

          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Usuń projekt
          </button>
        </div>
      )}
    </aside>
  );
}
