import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useToast } from './ToastContext';

const STACK_CAP = 20;

export interface UndoEntry {
  description: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

interface ProjectStacks {
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
}

interface UndoRedoContextValue {
  pushUndo: (entry: UndoEntry) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

export function useUndoRedo() {
  const ctx = useContext(UndoRedoContext);
  if (!ctx) throw new Error('useUndoRedo must be used within UndoRedoProvider');
  return ctx;
}

const noopUndoRedo: UndoRedoContextValue = {
  pushUndo: () => {},
  undo: async () => {},
  redo: async () => {},
  canUndo: false,
  canRedo: false,
};

/** Safe version that returns a no-op when outside the provider */
export function useOptionalUndoRedo(): UndoRedoContextValue {
  const ctx = useContext(UndoRedoContext);
  return ctx ?? noopUndoRedo;
}

interface UndoRedoProviderProps {
  activeProjectId: number | null;
  children: React.ReactNode;
}

export function UndoRedoProvider({ activeProjectId, children }: UndoRedoProviderProps) {
  const { addToast } = useToast();
  const stacksRef = useRef<Map<number, ProjectStacks>>(new Map());
  // Force re-render counter to update canUndo/canRedo
  const [, setRenderTick] = React.useState(0);
  const tick = useCallback(() => setRenderTick(c => c + 1), []);

  const getStacks = useCallback((projectId: number): ProjectStacks => {
    if (!stacksRef.current.has(projectId)) {
      stacksRef.current.set(projectId, { undoStack: [], redoStack: [] });
    }
    return stacksRef.current.get(projectId)!;
  }, []);

  const pushUndo = useCallback((entry: UndoEntry) => {
    if (!activeProjectId) return;
    const stacks = getStacks(activeProjectId);
    stacks.undoStack.push(entry);
    if (stacks.undoStack.length > STACK_CAP) {
      stacks.undoStack.shift();
    }
    // Clear redo stack on new action
    stacks.redoStack.length = 0;
    tick();
  }, [activeProjectId, getStacks, tick]);

  const undo = useCallback(async () => {
    if (!activeProjectId) return;
    const stacks = getStacks(activeProjectId);
    const entry = stacks.undoStack.pop();
    if (!entry) return;

    try {
      await entry.undo();
      stacks.redoStack.push(entry);
      if (stacks.redoStack.length > STACK_CAP) {
        stacks.redoStack.shift();
      }
      addToast(`Cofnięto: ${entry.description}`);
    } catch {
      addToast('Nie udało się cofnąć — dane mogły zostać zmienione', 'error');
    }
    tick();
  }, [activeProjectId, getStacks, addToast, tick]);

  const redo = useCallback(async () => {
    if (!activeProjectId) return;
    const stacks = getStacks(activeProjectId);
    const entry = stacks.redoStack.pop();
    if (!entry) return;

    try {
      await entry.redo();
      stacks.undoStack.push(entry);
      if (stacks.undoStack.length > STACK_CAP) {
        stacks.undoStack.shift();
      }
      addToast(`Ponowiono: ${entry.description}`);
    } catch {
      addToast('Nie udało się ponowić — dane mogły zostać zmienione', 'error');
    }
    tick();
  }, [activeProjectId, getStacks, addToast, tick]);

  // Focus-aware keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
         active.tagName === 'TEXTAREA' ||
         active.isContentEditable)
      ) {
        return;
      }

      const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z';
      const isRedo = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z';

      if (isRedo) {
        e.preventDefault();
        redo();
      } else if (isUndo) {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const currentStacks = activeProjectId ? getStacks(activeProjectId) : null;
  const canUndo = (currentStacks?.undoStack.length ?? 0) > 0;
  const canRedo = (currentStacks?.redoStack.length ?? 0) > 0;

  return (
    <UndoRedoContext.Provider value={{ pushUndo, undo, redo, canUndo, canRedo }}>
      {children}
    </UndoRedoContext.Provider>
  );
}
