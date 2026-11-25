import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MODULE_STORAGE_KEY,
  moduleFromPath,
  moduleHomePath,
  parseStoredModule,
  type AppModule,
} from './types';

type ModuleContextValue = {
  activeModule: AppModule;
  setModule: (module: AppModule, options?: { navigateHome?: boolean }) => void;
  homePath: string;
};

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeModule = moduleFromPath(location.pathname);

  useEffect(() => {
    try {
      localStorage.setItem(MODULE_STORAGE_KEY, activeModule);
    } catch {
      // ignore quota / private mode
    }
  }, [activeModule]);

  const setModule = useCallback(
    (module: AppModule, options?: { navigateHome?: boolean }) => {
      try {
        localStorage.setItem(MODULE_STORAGE_KEY, module);
      } catch {
        // ignore
      }
      if (options?.navigateHome !== false) {
        navigate(moduleHomePath(module));
      }
    },
    [navigate],
  );

  const value = useMemo(
    () => ({
      activeModule,
      setModule,
      homePath: moduleHomePath(activeModule),
    }),
    [activeModule, setModule],
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModule(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) {
    throw new Error('useModule must be used within ModuleProvider');
  }
  return ctx;
}

/** Preferred module when no path hint (e.g. post-login). URL still wins once inside the app. */
export function getPreferredModule(): AppModule {
  try {
    return parseStoredModule(localStorage.getItem(MODULE_STORAGE_KEY)) ?? 'recruitment';
  } catch {
    return 'recruitment';
  }
}
