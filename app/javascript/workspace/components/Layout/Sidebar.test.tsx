import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Sidebar from './Sidebar';
import type { ProjectListItem } from '../../types';

// --- controllable async mock for mutateAsync ---
const mockMutateAsync = vi.fn();

// Mock the hooks
vi.mock('../../hooks/useProjects', () => ({
  useToggleFavorite: () => ({ mutate: vi.fn() }),
  useReorderProjects: () => ({ mutate: vi.fn() }),
  useDeleteProject: () => ({ mutate: vi.fn() }),
  useDuplicateProject: () => ({
    mutate: vi.fn(),
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the API module (not used directly by Sidebar, but imported via hooks — keep for completeness)
vi.mock('../../api/projects', () => ({
  reorderProject: vi.fn(),
  duplicateProject: vi.fn(),
}));

// Build test fixtures
const ownedProject: ProjectListItem = {
  id: 1,
  name: 'Salon',
  favorite: false,
  position: 0,
  total_price: 5000,
  section_groups: [],
  sections: [],
  is_owner: true,
};

const memberProject: ProjectListItem = {
  id: 2,
  name: 'Kuchnia',
  favorite: false,
  position: 1,
  total_price: 2000,
  section_groups: [],
  sections: [],
  is_owner: false,
};

function renderSidebar(projects: ProjectListItem[], currentProjectId: number | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Sidebar projects={projects} currentProjectId={currentProjectId} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Sidebar context menu — duplicate entry', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockMutateAsync.mockReset();
    vi.clearAllMocks();
  });

  it('right-click on owned project shows "Duplikuj" menu entry', async () => {
    renderSidebar([ownedProject]);

    const projectEl = screen.getByText('Salon').closest('[class*="rounded-xl"]') as HTMLElement;
    fireEvent.contextMenu(projectEl);

    expect(await screen.findByText('Duplikuj')).toBeInTheDocument();
  });

  it('right-click on non-owned project does NOT show "Duplikuj"', async () => {
    renderSidebar([memberProject]);

    const projectEl = screen.getByText('Kuchnia').closest('[class*="rounded-xl"]') as HTMLElement;
    fireEvent.contextMenu(projectEl);

    // Context menu should be open (e.g., "Usuń projekt" visible)
    expect(await screen.findByText('Usuń projekt')).toBeInTheDocument();
    expect(screen.queryByText('Duplikuj')).not.toBeInTheDocument();
  });

  it('clicking "Duplikuj" calls mutateAsync and navigates to the new project', async () => {
    mockMutateAsync.mockResolvedValue({
      id: 99,
      name: 'Kopia: Salon',
      favorite: false,
      position: 0,
      total_price: 0,
      section_groups: [],
      sections: [],
      is_owner: true,
    });

    renderSidebar([ownedProject]);

    // Open context menu
    const projectEl = screen.getByText('Salon').closest('[class*="rounded-xl"]') as HTMLElement;
    fireEvent.contextMenu(projectEl);

    const dupButton = await screen.findByText('Duplikuj');
    fireEvent.click(dupButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(1);
      expect(mockNavigate).toHaveBeenCalledWith('/workspace/projects/99');
    });
  });
});
