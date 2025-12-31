import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.__INITIAL_DATA__ (used by useCurrentUser hook)
Object.defineProperty(window, '__INITIAL_DATA__', {
  writable: true,
  value: {
    currentUser: {
      id: 1,
      email: 'test@example.com',
      first_name: 'Jan',
      last_name: 'Kowalski',
      full_name: 'Jan Kowalski',
      display_name: 'Jan Kowalski',
      initials: 'JK',
      api_token: 'test-token-123',
    },
  },
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock ResizeObserver (used by some UI libraries)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});
