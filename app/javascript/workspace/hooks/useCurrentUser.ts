import { useMemo } from 'react';
import type { User } from '../types';

export function useCurrentUser(): User {
  return useMemo(() => {
    return window.__INITIAL_DATA__.currentUser;
  }, []);
}
