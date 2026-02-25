import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../tests/test-utils';
import ProjectToolbar from './ProjectToolbar';

// Mock the downloadPdf function
vi.mock('../../api/projects', () => ({
  downloadPdf: vi.fn(),
}));

import { downloadPdf } from '../../api/projects';

const defaultProps = {
  projectId: 1,
  itemIds: [10, 20, 30],
  searchQuery: '',
  onSearchChange: vi.fn(),
  sortBy: 'default' as const,
  onSortChange: vi.fn(),
  filters: { statuses: [], categories: [] },
  onFilterChange: vi.fn(),
  availableCategories: [],
  availableStatuses: [],
  customStatuses: [],
  customCategories: [],
  matchCount: 3,
  totalCount: 3,
  hasActiveFilters: false,
  viewMode: 'grid' as const,
  onViewModeChange: vi.fn(),
};

describe('ProjectToolbar PDF button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PDF button', () => {
    render(<ProjectToolbar {...defaultProps} />);
    expect(screen.getByText('Podglad PDF')).toBeInTheDocument();
  });

  it('calls downloadPdf with correct item IDs and opens blob URL', async () => {
    const mockBlob = new Blob(['%PDF-fake'], { type: 'application/pdf' });
    (downloadPdf as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlob);

    const mockOpen = vi.fn();
    const originalOpen = window.open;
    window.open = mockOpen;

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-pdf');
    const mockRevokeObjectURL = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    render(<ProjectToolbar {...defaultProps} itemIds={[10, 20, 30]} />);

    fireEvent.click(screen.getByText('Podglad PDF'));

    await waitFor(() => {
      expect(downloadPdf).toHaveBeenCalledWith(1, [10, 20, 30]);
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockOpen).toHaveBeenCalledWith('blob:http://localhost/fake-pdf', '_blank');
    });

    // Restore
    window.open = originalOpen;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('shows loading state during PDF download', async () => {
    // Create a promise we can control
    let resolveDownload: (blob: Blob) => void;
    const downloadPromise = new Promise<Blob>((resolve) => {
      resolveDownload = resolve;
    });
    (downloadPdf as ReturnType<typeof vi.fn>).mockReturnValue(downloadPromise);

    const mockOpen = vi.fn();
    window.open = mockOpen;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');

    render(<ProjectToolbar {...defaultProps} />);

    // Click PDF button
    fireEvent.click(screen.getByText('Podglad PDF'));

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Generowanie...')).toBeInTheDocument();
    });

    // The button should be disabled
    const button = screen.getByText('Generowanie...').closest('button');
    expect(button).toBeDisabled();

    // Resolve the download
    resolveDownload!(new Blob(['%PDF-fake'], { type: 'application/pdf' }));

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Podglad PDF')).toBeInTheDocument();
    });
  });
});
