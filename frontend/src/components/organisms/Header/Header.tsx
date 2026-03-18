import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { MenuUsuario } from '../../molecules/MenuUsuario/MenuUsuario';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-8 xs:px-4 z-40 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar clientes, processos ou guias..."
            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 dark:focus:border-blue-500/50 transition-all text-text-main placeholder:text-text-secondary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-slate-950" />
        </button>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 xs:hidden" />
        <MenuUsuario />
      </div>
    </header>
  );
};
