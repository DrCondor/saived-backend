import { apiClient } from './client';
import type {
  ProjectSection,
  CreateSectionInput,
  UpdateSectionInput,
} from '../types';

export async function createSection(
  projectId: number,
  input: CreateSectionInput = {}
): Promise<ProjectSection> {
  return apiClient<ProjectSection>(`/projects/${projectId}/sections`, {
    method: 'POST',
    json: { section: input },
  });
}

export async function updateSection(
  projectId: number,
  sectionId: number,
  input: UpdateSectionInput
): Promise<ProjectSection> {
  return apiClient<ProjectSection>(
    `/projects/${projectId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      json: { section: input },
    }
  );
}

export async function deleteSection(
  projectId: number,
  sectionId: number
): Promise<void> {
  await apiClient(`/projects/${projectId}/sections/${sectionId}`, {
    method: 'DELETE',
  });
}
