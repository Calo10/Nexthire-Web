import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavContextValue {
  openMenu: boolean;
  setOpenMenu: (open: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <MobileNavContext.Provider value={{ openMenu, setOpenMenu }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error('useMobileNav must be used within a MobileNavProvider');
  }
  return context;
}
