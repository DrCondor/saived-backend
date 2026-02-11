import { apiClient } from './client';
import type {
  SectionGroup,
  CreateSectionGroupInput,
  UpdateSectionGroupInput,
} from '../types';

export async function createSectionGroup(
  projectId: number,
  input: CreateSectionGroupInput = {}
): Promise<SectionGroup> {
  return apiClient<SectionGroup>(`/projects/${projectId}/section_groups`, {
    method: 'POST',
    json: { section_group: input },
  });
}

export async function updateSectionGroup(
  projectId: number,
  groupId: number,
  input: UpdateSectionGroupInput
): Promise<SectionGroup> {
  return apiClient<SectionGroup>(
    `/projects/${projectId}/section_groups/${groupId}`,
    {
      method: 'PATCH',
      json: { section_group: input },
    }
  );
}

export async function deleteSectionGroup(
  projectId: number,
  groupId: number
): Promise<void> {
  await apiClient(`/projects/${projectId}/section_groups/${groupId}`, {
    method: 'DELETE',
  });
}

export async function restoreSectionGroup(
  projectId: number,
  groupId: number
): Promise<SectionGroup> {
  return apiClient<SectionGroup>(
    `/projects/${projectId}/section_groups/${groupId}/restore`,
    { method: 'POST' }
  );
}
