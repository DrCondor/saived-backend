import { useQuery } from '@tanstack/react-query';
import { fetchProject } from '../api/projects';

export function useProject(id: number | null) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id!),
    enabled: id !== null,
  });
}
