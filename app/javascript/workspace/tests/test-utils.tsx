import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a new QueryClient for each test to avoid shared state
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: 0, // Disable garbage collection
        staleTime: 0, // Always consider data stale
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render function that includes all providers
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Export query client creator for hook testing
export { createTestQueryClient };

// Mock project data for tests
export const mockProjects = [
  {
    id: 1,
    name: 'Projekt Salon',
    favorite: false,
    position: 0,
    total_price: 5000,
    sections: [
      { id: 1, name: 'Meble', position: 0 },
      { id: 2, name: 'Oswietlenie', position: 1 },
    ],
  },
  {
    id: 2,
    name: 'Projekt Kuchnia',
    favorite: true,
    position: 1,
    total_price: 12000,
    sections: [{ id: 3, name: 'Sprzety', position: 0 }],
  },
];

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Jan',
  last_name: 'Kowalski',
  full_name: 'Jan Kowalski',
  display_name: 'Jan Kowalski',
  initials: 'JK',
  company_name: 'Design Studio',
  phone: '123456789',
  title: 'Interior Designer',
  avatar_url: null,
  api_token: 'test-token-123',
};

export const mockSection = {
  id: 1,
  name: 'Meble',
  position: 0,
  total_price: 2500,
  items: [
    {
      id: 1,
      name: 'Sofa',
      note: 'Nice sofa',
      quantity: 1,
      unit_price: 2500,
      total_price: 2500,
      currency: 'PLN',
      category: 'Meble',
      status: 'propozycja',
      external_url: 'https://example.com/sofa',
      thumbnail_url: 'https://example.com/sofa.jpg',
      position: 0,
    },
  ],
};

export const mockItem = {
  id: 1,
  name: 'Krzeslo',
  note: 'Wygodne krzeslo',
  quantity: 4,
  unit_price: 299.99,
  total_price: 1199.96,
  currency: 'PLN',
  category: 'Meble',
  dimensions: '50x50x100 cm',
  status: 'propozycja',
  external_url: 'https://example.com/krzeslo',
  thumbnail_url: 'https://example.com/krzeslo.jpg',
  discount_label: null,
  position: 0,
};
