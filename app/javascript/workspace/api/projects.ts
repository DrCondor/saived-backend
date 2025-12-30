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
