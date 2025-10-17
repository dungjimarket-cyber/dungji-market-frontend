'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ServerStatusContextType {
  isServerDown: boolean;
  setServerDown: (down: boolean) => void;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export function ServerStatusProvider({ children }: { children: ReactNode }) {
  const [isServerDown, setIsServerDown] = useState(false);

  const setServerDown = useCallback((down: boolean) => {
    setIsServerDown(down);

    // 로깅 (디버깅용)
    if (down) {
      console.warn('🔴 [서버 상태] 백엔드 서버 다운 감지');
    } else {
      console.info('🟢 [서버 상태] 백엔드 서버 복구됨');
    }
  }, []);

  return (
    <ServerStatusContext.Provider value={{ isServerDown, setServerDown }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  const context = useContext(ServerStatusContext);
  if (context === undefined) {
    throw new Error('useServerStatus must be used within ServerStatusProvider');
  }
  return context;
}
