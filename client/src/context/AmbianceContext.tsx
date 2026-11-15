import React, { createContext, useContext, useState } from 'react';

export type AmbianceMode = 'sakura' | 'sparkle' | 'mint' | 'none';

interface AmbianceContextValue {
  mode: AmbianceMode;
  setMode: (mode: AmbianceMode) => void;
}

const STORAGE_KEY = 'pocket48_ambiance_mode';

const AmbianceContext = createContext<AmbianceContextValue | undefined>(undefined);

export const AmbianceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<AmbianceMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (
        saved === 'sakura' ||
        saved === 'sparkle' ||
        saved === 'mint' ||
        saved === 'none'
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'sakura';
  });

  const setMode = (nextMode: AmbianceMode) => {
    setModeState(nextMode);
    try {
      localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // ignore
    }
  };

  return (
    <AmbianceContext.Provider value={{ mode, setMode }}>
      {children}
    </AmbianceContext.Provider>
  );
};

export function useAmbiance(): AmbianceContextValue {
  const ctx = useContext(AmbianceContext);
  if (!ctx) {
    // Graceful default for standalone tests
    return { mode: 'sakura', setMode: () => {} };
  }
  return ctx;
}
