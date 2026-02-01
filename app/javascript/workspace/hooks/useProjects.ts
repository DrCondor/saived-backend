import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleFavorite,
  reorderProjects,
} from '../api/projects';
import type { CreateProjectInput, UpdateProjectInput, ProjectListItem } from '../types';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateProjectInput }) =>
      updateProject(id, input),
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      await queryClient.cancelQueries({ queryKey: ['project', id] });

      // Snapshot previous values
      const previousProjects = queryClient.getQueryData<ProjectListItem[]>(['projects']);
      const previousProject = queryClient.getQueryData(['project', id]);

      // Optimistically update projects list
      if (previousProjects) {
        queryClient.setQueryData<ProjectListItem[]>(
          ['projects'],
          previousProjects.map((p) =>
            p.id === id ? { ...p, ...input } : p
          )
        );
      }

      // Optimistically update single project
      if (previousProject) {
        queryClient.setQueryData(['project', id], { ...previousProject, ...input });
      }

      return { previousProjects, previousProject };
    },
    onError: (_, { id }, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(['project', id], context.previousProject);
      }
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleFavorite(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<ProjectListItem[]>(['projects']);

      // Optimistically update
      if (previousProjects) {
        queryClient.setQueryData<ProjectListItem[]>(
          ['projects'],
          previousProjects.map((p) =>
            p.id === id ? { ...p, favorite: !p.favorite } : p
          )
        );
      }

      return { previousProjects };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectOrder: number[]) => reorderProjects(projectOrder),
    onMutate: async (projectOrder) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      const previousProjects = queryClient.getQueryData<ProjectListItem[]>(['projects']);

      // Optimistically reorder
      if (previousProjects) {
        const reordered = projectOrder
          .map((id) => previousProjects.find((p) => p.id === id))
          .filter((p): p is ProjectListItem => p !== undefined)
          .map((p, index) => ({ ...p, position: index }));
        queryClient.setQueryData<ProjectListItem[]>(['projects'], reordered);
      }

      return { previousProjects };
    },
    onError: (_, __, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
