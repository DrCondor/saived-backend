import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../tests/test-utils';
import FavoritePicker from './FavoritePicker';
import type { FavoriteItem } from '../../types';

const mockFavorites: FavoriteItem[] = [
  {
    id: 1,
    name: 'Szafka MALM',
    thumbnail_url: 'https://ikea.pl/img/malm.jpg',
    total_price: 499.0,
    currency: 'PLN',
    external_url: 'https://ikea.pl/p/malm',
    item_type: 'product',
    project_id: 10,
    project_name: 'Apartament Wilanów',
    section_name: 'Sypialnia',
  },
  {
    id: 2,
    name: 'Elektryk Jan',
    thumbnail_url: null,
    total_price: 3000.0,
    currency: 'PLN',
    external_url: null,
    item_type: 'contractor',
    project_id: 10,
    project_name: 'Apartament Wilanów',
    section_name: 'Usługi',
  },
  {
    id: 3,
    name: 'Uwaga dla klienta',
    thumbnail_url: null,
    total_price: null,
    currency: 'PLN',
    external_url: null,
    item_type: 'note',
    project_id: 10,
    project_name: 'Apartament Wilanów',
    section_name: 'Notatki',
  },
];

// Mock useFavorites hook
vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({
    data: mockFavorites,
    isLoading: false,
  }),
  useToggleFavorite: () => ({ mutate: vi.fn() }),
}));

describe('FavoritePicker', () => {
  const defaultProps = {
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders favorites list excluding notes', () => {
    render(<FavoritePicker {...defaultProps} />);

    expect(screen.getByText('Szafka MALM')).toBeInTheDocument();
    expect(screen.getByText('Elektryk Jan')).toBeInTheDocument();
    expect(screen.queryByText('Uwaga dla klienta')).not.toBeInTheDocument();
  });

  it('shows header with title', () => {
    render(<FavoritePicker {...defaultProps} />);

    expect(screen.getByText('Dodaj z ulubionych')).toBeInTheDocument();
  });

  it('displays project name for each item', () => {
    render(<FavoritePicker {...defaultProps} />);

    const projectNames = screen.getAllByText('Apartament Wilanów');
    expect(projectNames.length).toBe(2); // product + contractor, not note
  });

  it('filters favorites by search term', () => {
    render(<FavoritePicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Szukaj w ulubionych...');
    fireEvent.change(searchInput, { target: { value: 'MALM' } });

    expect(screen.getByText('Szafka MALM')).toBeInTheDocument();
    expect(screen.queryByText('Elektryk Jan')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no matches', () => {
    render(<FavoritePicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Szukaj w ulubionych...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('Brak wyników dla tego wyszukiwania')).toBeInTheDocument();
  });

  it('calls onSelect with item id when add button is clicked', () => {
    const onSelect = vi.fn();
    render(<FavoritePicker {...defaultProps} onSelect={onSelect} />);

    const addButtons = screen.getAllByTitle('Dodaj do sekcji');
    fireEvent.click(addButtons[0]);

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<FavoritePicker {...defaultProps} onClose={onClose} />);

    // The close button is the X button in the header
    const closeButtons = screen.getAllByRole('button');
    // First button should be the close (X) button in the header
    const closeButton = closeButtons.find((btn) =>
      btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    );
    if (closeButton) fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
