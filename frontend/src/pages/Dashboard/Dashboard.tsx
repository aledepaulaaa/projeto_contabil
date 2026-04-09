import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { BarraLateral } from '../../components/organisms/BarraLateral/BarraLateral';
import { Header } from '../../components/organisms/Header/Header';
import { ModalErroGlobal } from '../../components/organisms/ModalErroGlobal/ModalErroGlobal';
import { ResumoDashboard } from './ResumoDashboard';
import { CRM } from './CRM';
import { Atendimento } from './Atendimento';
import { Contratos } from './Contratos';
import { Rotinas } from './Rotinas';
import { Onboarding } from './Onboarding';
import { Alvaras } from './Alvaras';
import { Processos } from './Processos';
import { Perfil } from './Perfil';
import { AlterarSenha } from './AlterarSenha';
import { Configuracoes } from './Configuracoes';
import { FloatingHistoryIndicator } from '../../components/molecules/FloatingHistoryIndicator/FloatingHistoryIndicator';

export const Dashboard: React.FC = () => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (location) {
      case '/dashboard':
        return <ResumoDashboard />;
      case '/dashboard/crm':
        return <CRM />;
      case '/dashboard/atendimento':
        return <Atendimento />;
      case '/dashboard/contratos':
        return <Contratos />;
      case '/dashboard/onboarding':
        return <Onboarding />;
      case '/dashboard/rotinas':
        return <Rotinas />;
      case '/dashboard/alvaras':
        return <Alvaras />;
      case '/dashboard/processos':
        return <Processos />;
      case '/dashboard/perfil':
        return <Perfil />;
      case '/dashboard/alterar-senha':
        return <AlterarSenha />;
      case '/dashboard/configuracoes':
        return <Configuracoes />;
      default:
        return <ResumoDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent font-sans text-text-main transition-colors duration-300">
      <BarraLateral isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 xs:p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent bg-slate-50/50 dark:bg-transparent transition-colors">
          <div className={`${location === '/dashboard/atendimento' ? 'max-w-full px-4 lg:px-8' : 'max-w-7xl'} mx-auto h-full`}>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Modal de Erro Global — acessível em todas as rotas */}
      <ModalErroGlobal />

      {/* Histórico Geral Flutuante — Acessível em todos os módulos */}
      <FloatingHistoryIndicator />
    </div>
  );
};
