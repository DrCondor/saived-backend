import { apiClient } from './client';
import type {
  Project,
  ProjectListItem,
  CreateProjectInput,
  UpdateProjectInput,
  ReorderInput,
} from '../types';

interface ProjectsResponse {
  projects: ProjectListItem[];
}

export async function fetchProjects(): Promise<ProjectListItem[]> {
  const data = await apiClient<ProjectsResponse>('/projects');
  return data.projects;
}

export async function fetchProject(id: number): Promise<Project> {
  return apiClient<Project>(`/projects/${id}`);
}

export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  return apiClient<Project>('/projects', {
    method: 'POST',
    json: { project: input },
  });
}

export async function updateProject(
  id: number,
  input: UpdateProjectInput
): Promise<Project> {
  return apiClient<Project>(`/projects/${id}`, {
    method: 'PATCH',
    json: { project: input },
  });
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient(`/projects/${id}`, { method: 'DELETE' });
}

export async function reorderProject(
  id: number,
  input: ReorderInput
): Promise<Project> {
  return apiClient<Project>(`/projects/${id}/reorder`, {
    method: 'POST',
    json: input,
  });
}

export async function toggleFavorite(
  id: number
): Promise<{ id: number; favorite: boolean }> {
  return apiClient<{ id: number; favorite: boolean }>(
    `/projects/${id}/toggle_favorite`,
    { method: 'POST' }
  );
}

export async function reorderProjects(
  projectOrder: number[]
): Promise<{ projects: ProjectListItem[] }> {
  return apiClient<{ projects: ProjectListItem[] }>('/projects/reorder', {
    method: 'POST',
    json: { project_order: projectOrder },
  });
}
