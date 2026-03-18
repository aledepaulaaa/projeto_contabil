import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMobileResolution } from '../hooks/useMobileResolution';

interface ResolucaoContextProps {
  isMobile: boolean; // Retorna true se a largura for <= 320px
}

const ResolucaoContext = createContext<ResolucaoContextProps | undefined>(undefined);

export const ResolucaoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isMobile = useMobileResolution(320); // Foco no breakpoint XS (320px)

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
