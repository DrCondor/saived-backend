import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useToggleFavorite,
} from './useProjects';
import * as api from '../api/projects';
import { mockProjects } from '../tests/test-utils';

// Mock the API module
vi.mock('../api/projects');

const mockedApi = vi.mocked(api);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches projects successfully', async () => {
    mockedApi.fetchProjects.mockResolvedValueOnce(mockProjects);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
    expect(mockedApi.fetchProjects).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error', async () => {
    mockedApi.fetchProjects.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates project successfully', async () => {
    const newProject = { id: 3, name: 'New Project', favorite: false, position: 2, total_price: 0, sections: [] };
    mockedApi.createProject.mockResolvedValueOnce(newProject);
    mockedApi.fetchProjects.mockResolvedValueOnce([...mockProjects, newProject]);

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'New Project' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApi.createProject).toHaveBeenCalledWith({ name: 'New Project' });
  });
});

describe('useDeleteProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes project successfully', async () => {
    mockedApi.deleteProject.mockResolvedValueOnce(undefined);
    mockedApi.fetchProjects.mockResolvedValueOnce([mockProjects[1]]);

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApi.deleteProject).toHaveBeenCalledWith(1);
  });
});

describe('useToggleFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles favorite status', async () => {
    mockedApi.toggleFavorite.mockResolvedValueOnce({ id: 1, favorite: true });
    mockedApi.fetchProjects.mockResolvedValueOnce([
      { ...mockProjects[0], favorite: true },
      mockProjects[1],
    ]);

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApi.toggleFavorite).toHaveBeenCalledWith(1);
  });
});
