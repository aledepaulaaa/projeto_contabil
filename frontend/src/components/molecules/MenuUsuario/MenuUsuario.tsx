import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Key, LogOut, ChevronDown, Shield, Settings } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useLocation } from 'wouter';
import { useDepartamentos } from '../../../hooks/useDepartamentos';

export const MenuUsuario: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { logout, user, papel, departamentoId } = useAuthStore();
  const { getDeptoInfo } = useDepartamentos();
  const menuRef = useRef<HTMLDivElement>(null);

  const depto = getDeptoInfo(departamentoId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nomeExibicao = user?.nome || 'Usuário';
  const iniciais = nomeExibicao.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
          {iniciais}
        </div>
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{nomeExibicao}</p>
            {papel && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                papel === 'ADMIN' ? 'bg-amber-500/20 text-amber-600' :
                papel === 'GESTOR' ? 'bg-blue-500/20 text-blue-600' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {papel}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-tight">
            {depto.label}
          </p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl p-2 shadow-2xl z-50 ring-1 ring-slate-900/5"
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Conta</p>
            </div>
            
            <button 
              onClick={() => { setLocation('/dashboard/perfil'); setIsOpen(false); }}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 transition-all font-medium"
            >
              <User size={18} className="text-slate-600 dark:text-slate-400" />
              Meu Perfil
            </button>
            {(papel === 'ADMIN' || papel === 'GESTOR') && (
              <button 
                onClick={() => { setLocation('/dashboard/configuracoes'); setIsOpen(false); }}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 transition-all font-medium"
              >
                <Settings size={18} className="text-blue-600 dark:text-blue-400" />
                Configurações
              </button>
            )}
            <button 
              onClick={() => { setLocation('/assinaturas'); setIsOpen(false); }}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 transition-all font-medium"
            >
              <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
              Assinaturas
            </button>
            <button 
              onClick={() => { setLocation('/dashboard/alterar-senha'); setIsOpen(false); }}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 transition-all font-medium"
            >
              <Key size={18} className="text-amber-600 dark:text-amber-400" />
              Alterar Senha
            </button>
            
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
            
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-rose-500/10 text-sm text-rose-500 dark:text-rose-400 transition-all font-bold uppercase tracking-tight"
            >
              <LogOut size={18} />
              Sair com segurança
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
