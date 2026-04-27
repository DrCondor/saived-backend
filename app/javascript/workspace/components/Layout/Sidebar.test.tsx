import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Sidebar from './Sidebar';
import type { ProjectListItem } from '../../types';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock DnD kit — it requires complex browser APIs we don't care about in unit tests
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
    children(
      { innerRef: () => {}, droppableProps: {}, placeholder: null },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}));

// Mock hooks that make API calls
vi.mock('../../hooks/useProjects', () => ({
  useToggleFavorite: () => ({ mutate: vi.fn() }),
  useReorderProjects: () => ({ mutate: vi.fn() }),
  useDeleteProject: () => ({ mutate: vi.fn() }),
  useDuplicateProject: vi.fn(),
}));

// Mock api/projects to avoid real HTTP calls
vi.mock('../../api/projects', () => ({
  reorderProject: vi.fn(),
  duplicateProject: vi.fn(),
}));

import { useDuplicateProject } from '../../hooks/useProjects';

const mockedUseDuplicateProject = vi.mocked(useDuplicateProject);

function buildProject(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 1,
    name: 'Salon Kowalskich',
    favorite: false,
    position: 0,
    total_price: 5000,
    is_owner: true,
    section_groups: [],
    sections: [],
    ...overrides,
  };
}

function renderSidebar(projects: ProjectListItem[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Sidebar projects={projects} currentProjectId={null} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function openContextMenu(projectName: string) {
  // Right-click on the project row to open context menu
  const projectRows = screen.getAllByText(projectName);
  const projectRow = projectRows[0].closest('[oncontextmenu]') || projectRows[0].parentElement!.parentElement!.parentElement!;
  fireEvent.contextMenu(projectRow);
}

describe('Sidebar context menu - Duplikuj projekt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows "Duplikuj projekt" when is_owner is true', () => {
    const mockMutate = vi.fn();
    mockedUseDuplicateProject.mockReturnValue({ mutate: mockMutate } as any);

    const project = buildProject({ is_owner: true });
    renderSidebar([project]);

    openContextMenu(project.name);

    expect(screen.getByText('Duplikuj projekt')).toBeInTheDocument();
  });

  it('does not show "Duplikuj projekt" when is_owner is false', () => {
    const mockMutate = vi.fn();
    mockedUseDuplicateProject.mockReturnValue({ mutate: mockMutate } as any);

    const project = buildProject({ is_owner: false });
    renderSidebar([project]);

    openContextMenu(project.name);

    expect(screen.queryByText('Duplikuj projekt')).not.toBeInTheDocument();
  });

  it('shows only favorite toggle and delete when is_owner is false', () => {
    const mockMutate = vi.fn();
    mockedUseDuplicateProject.mockReturnValue({ mutate: mockMutate } as any);

    const project = buildProject({ is_owner: false });
    renderSidebar([project]);

    openContextMenu(project.name);

    // Should have the favorite button and delete button but not duplicate
    expect(screen.getByText(/Usuń projekt/)).toBeInTheDocument();
    expect(screen.queryByText('Duplikuj projekt')).not.toBeInTheDocument();
  });

  it('calls useDuplicateProject mutate with the project id on click', async () => {
    const mockMutate = vi.fn();
    mockedUseDuplicateProject.mockReturnValue({ mutate: mockMutate } as any);

    const project = buildProject({ id: 42, is_owner: true });
    renderSidebar([project]);

    openContextMenu(project.name);
    fireEvent.click(screen.getByText('Duplikuj projekt'));

    expect(mockMutate).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('navigates to new project on successful duplication', async () => {
    const newProject = { id: 99, name: 'Salon Kowalskich (kopia)' };
    let capturedOnSuccess: ((data: any) => void) | undefined;

    const mockMutate = vi.fn().mockImplementation((_id, options) => {
      capturedOnSuccess = options?.onSuccess;
    });
    mockedUseDuplicateProject.mockReturnValue({ mutate: mockMutate } as any);

    const project = buildProject({ id: 42, is_owner: true });
    renderSidebar([project]);

    openContextMenu(project.name);
    fireEvent.click(screen.getByText('Duplikuj projekt'));

    // Simulate the mutation success callback
    capturedOnSuccess?.(newProject);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/projects/99');
  });

  it('closes context menu after clicking duplicate', async () => {
    const mockMutate = vi.fn();
    mockedUseDuplicateProject.mockReturnValue({ mutate: mockMutate } as any);

    const project = buildProject({ id: 1, is_owner: true });
    renderSidebar([project]);

    openContextMenu(project.name);
    expect(screen.getByText('Duplikuj projekt')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Duplikuj projekt'));

    // Context menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('Duplikuj projekt')).not.toBeInTheDocument();
    });
  });
});
