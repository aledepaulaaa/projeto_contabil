import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Rocket,
  Calendar,
  FileText,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useTheme } from '../../../contexts/ThemeContext';

interface BarraLateralProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface ItemMenuProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}

const ItemMenu: React.FC<ItemMenuProps> = ({ icon: Icon, label, active, expanded, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center w-full p-3 rounded-xl transition-all duration-200 group relative
      ${active
        ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-white'}
    `}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />

    <AnimatePresence>
      {expanded && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="ml-3 font-sans font-medium whitespace-nowrap overflow-hidden"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>

    {!expanded && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        {label}
      </div>
    )}
  </button>
);

export const BarraLateral: React.FC<BarraLateralProps> = ({ isOpen, onClose }) => {
  const [expanded, setExpanded] = useState(true);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/crm', label: 'CRM / Leads', icon: Users },
    { path: '/dashboard/onboarding', label: 'Onboarding', icon: Rocket },
    { path: '/dashboard/rotinas', label: 'Rotinas', icon: Calendar },
    { path: '/dashboard/alvaras', label: 'Alvarás', icon: FileText },
    { path: '/dashboard/processos', label: 'Processos', icon: Briefcase },
  ];

  const sidebarVariants = {
    open: { x: 0, width: 260 },
    closed: { x: 0, width: 80 },
    mobileOpen: { x: 0, width: 280 },
    mobileClosed: { x: -300 }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isOpen ? 'mobileOpen' : (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobileClosed' : (expanded ? 'open' : 'closed'))}
        variants={sidebarVariants}
        className={`
          fixed inset-y-0 left-0 z-[70] lg:sticky lg:flex flex-col h-screen 
          bg-white/80 dark:bg-slate-950/40 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/50 p-4 
          transition-all duration-300 overflow-x-hidden shadow-xl lg:shadow-none
        `}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center h-14">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Briefcase className="text-white" size={24} />
            </div>
            <AnimatePresence>
              {(expanded || isOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3 font-display font-bold text-xl text-slate-900 dark:text-white whitespace-nowrap"
                >
                  Contábil<span className="text-blue-600 dark:text-blue-500">Pro</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {isOpen && (
            <button onClick={onClose} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2">
              <X size={24} />
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {menuItems.map((item) => (
            <ItemMenu
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path))}
              expanded={expanded || !!isOpen}
              onClick={() => {
                setLocation(item.path);
                if (isOpen && onClose) onClose();
              }}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-800/50 flex items-center gap-3 transition-all"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} className="text-amber-500" />}
            {(expanded || isOpen) && <span className="text-sm font-medium">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="hidden lg:flex p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-800/50 items-center justify-center transition-all"
          >
            {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
