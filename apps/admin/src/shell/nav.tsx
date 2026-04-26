import { createContext, useContext } from 'react';
import type { ScreenId } from './Shell';

export const NavContext = createContext<((id: ScreenId) => void) | null>(null);

export function useNavigate(): (id: ScreenId) => void {
  const fn = useContext(NavContext);
  if (!fn) throw new Error('useNavigate must be used inside <NavContext.Provider>');
  return fn;
}
