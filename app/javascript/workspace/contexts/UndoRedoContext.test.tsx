import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from './ToastContext';
import { UndoRedoProvider, useUndoRedo } from './UndoRedoContext';

function createWrapper(projectId: number | null = 1) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ToastProvider>
        <UndoRedoProvider activeProjectId={projectId}>
          {children}
        </UndoRedoProvider>
      </ToastProvider>
    );
  };
}

function createEntry(description = 'test action') {
  return {
    description,
    undo: vi.fn().mockResolvedValue(undefined),
    redo: vi.fn().mockResolvedValue(undefined),
  };
}

describe('UndoRedoContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with empty stacks', () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('push makes canUndo true', () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });

    act(() => {
      result.current.pushUndo(createEntry());
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo calls entry.undo and enables redo', async () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });
    const entry = createEntry();

    act(() => {
      result.current.pushUndo(entry);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(entry.undo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo calls entry.redo and restores undo', async () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });
    const entry = createEntry();

    act(() => {
      result.current.pushUndo(entry);
    });

    await act(async () => {
      await result.current.undo();
    });

    await act(async () => {
      await result.current.redo();
    });

    expect(entry.redo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('new action clears redo stack', async () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });

    act(() => {
      result.current.pushUndo(createEntry('first'));
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.pushUndo(createEntry('second'));
    });

    expect(result.current.canRedo).toBe(false);
  });

  it('caps undo stack at 20', async () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.pushUndo(createEntry(`action ${i}`));
      }
    });

    // Undo all — should only be able to undo 20 times
    let undoCount = 0;
    while (result.current.canUndo && undoCount < 30) {
      await act(async () => {
        await result.current.undo();
      });
      undoCount++;
    }

    expect(undoCount).toBe(20);
  });

  it('stacks are scoped per project', () => {
    // Project 1
    const { result: result1 } = renderHook(() => useUndoRedo(), {
      wrapper: createWrapper(1),
    });

    act(() => {
      result1.current.pushUndo(createEntry('project 1 action'));
    });

    expect(result1.current.canUndo).toBe(true);

    // Project 2 — separate hook instance, separate wrapper
    const { result: result2 } = renderHook(() => useUndoRedo(), {
      wrapper: createWrapper(2),
    });

    expect(result2.current.canUndo).toBe(false);
  });

  it('focus-aware keyboard handler: skips when input focused', async () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });
    const entry = createEntry();

    act(() => {
      result.current.pushUndo(entry);
    });

    // Create and focus an input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Dispatch Ctrl+Z while input is focused
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      }));
    });

    // Should NOT have called undo
    expect(entry.undo).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);

    document.body.removeChild(input);
  });

  it('keyboard handler triggers undo on Ctrl+Z', async () => {
    const { result } = renderHook(() => useUndoRedo(), { wrapper: createWrapper() });
    const entry = createEntry();

    act(() => {
      result.current.pushUndo(entry);
    });

    // Blur any focused element to ensure document.activeElement is body
    (document.activeElement as HTMLElement)?.blur?.();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      }));
      // Let the async undo resolve
      await vi.runAllTimersAsync();
    });

    expect(entry.undo).toHaveBeenCalledOnce();
  });
});
