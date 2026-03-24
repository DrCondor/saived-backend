import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Header from './Header';
import { ThemeProvider } from '../../contexts/ThemeContext';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  display_name: 'Jan Kowalski',
  initials: 'JK',
  avatar_url: null,
  api_token: 'test-token',
};

function renderHeader() {
  // Set initial data for useCurrentUser
  (window as any).__INITIAL_DATA__ = { currentUser: mockUser };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  queryClient.setQueryData(['currentUser'], mockUser);

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Header theme toggle', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark', 'transitioning');
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove('dark', 'transitioning');
    localStorage.clear();
  });

  it('renders moon icon in light mode', () => {
    renderHeader();
    const toggle = screen.getByLabelText('Włącz tryb ciemny');
    expect(toggle).toBeInTheDocument();
  });

  it('renders sun icon in dark mode', () => {
    document.documentElement.classList.add('dark');
    renderHeader();
    const toggle = screen.getByLabelText('Włącz tryb jasny');
    expect(toggle).toBeInTheDocument();
  });

  it('clicking toggle switches to dark mode', () => {
    renderHeader();
    const toggle = screen.getByLabelText('Włącz tryb ciemny');
    fireEvent.click(toggle);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Now should show sun icon
    expect(screen.getByLabelText('Włącz tryb jasny')).toBeInTheDocument();
  });
});
