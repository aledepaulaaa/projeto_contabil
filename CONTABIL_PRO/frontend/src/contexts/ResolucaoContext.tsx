import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMobileResolution } from '../hooks/useMobileResolution';

interface ResolucaoContextProps {
  isMobile: boolean; // Retorna true se a largura for <= 320px
}

const ResolucaoContext = createContext<ResolucaoContextProps | undefined>(undefined);

export const ResolucaoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isMobile = useMobileResolution(1024); // Foco no breakpoint mobile/tablet para layout responsivo

  return (
    <ResolucaoContext.Provider value={{ isMobile }}>
      {children}
    </ResolucaoContext.Provider>
  );
};

export const useResolucao = (): ResolucaoContextProps => {
  const context = useContext(ResolucaoContext);
  if (!context) {
    throw new Error('useResolucao deve ser usado dentro de um ResolucaoProvider');
  }
  return context;
};
