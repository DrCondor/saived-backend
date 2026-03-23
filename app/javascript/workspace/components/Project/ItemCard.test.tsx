import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../tests/test-utils';
import ItemCard from './ItemCard';
import type { ProjectItem } from '../../types';

const mockItem: ProjectItem = {
  id: 1,
  name: 'Krzesło IKEA',
  note: 'Czarne',
  quantity: 2,
  unit_type: 'szt',
  unit_price: 299.99,
  total_price: 599.98,
  currency: 'PLN',
  category: 'Meble',
  dimensions: '80x45x90',
  status: 'kupione',
  external_url: 'https://ikea.pl/p/123',
  discount_label: null,
  discount_percent: null,
  discount_code: null,
  original_unit_price: null,
  thumbnail_url: 'https://ikea.pl/img/123.jpg',
  position: 0,
  item_type: 'product',
  address: null,
  phone: null,
  attachment_url: null,
  attachment_filename: null,
  favorite: false,
};

describe('ItemCard', () => {
  it('renders duplicate button when onDuplicate is provided', () => {
    const onDuplicate = vi.fn();
    render(<ItemCard item={mockItem} onDuplicate={onDuplicate} />);

    const button = screen.getByTitle('Duplikuj');
    expect(button).toBeInTheDocument();
  });

  it('does not render duplicate button when onDuplicate is not provided', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.queryByTitle('Duplikuj')).not.toBeInTheDocument();
  });

  it('calls onDuplicate with item id when clicked', () => {
    const onDuplicate = vi.fn();
    render(<ItemCard item={mockItem} onDuplicate={onDuplicate} />);

    fireEvent.click(screen.getByTitle('Duplikuj'));
    expect(onDuplicate).toHaveBeenCalledWith(1);
  });
});
