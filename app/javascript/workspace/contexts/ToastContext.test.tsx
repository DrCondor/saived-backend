import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from './ToastContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('Test message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('adds an error toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('Error!', 'error');
    });

    expect(result.current.toasts[0].type).toBe('error');
  });

  it('auto-dismisses after 3 seconds', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('Disappearing');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('stacks multiple toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('Toast 1');
      result.current.addToast('Toast 2');
      result.current.addToast('Toast 3');
    });

    expect(result.current.toasts).toHaveLength(3);
  });

  it('dismisses toasts independently', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('First');
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    act(() => {
      result.current.addToast('Second');
    });

    // First should dismiss at 3000ms, second at 4500ms
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Second');
  });
});
