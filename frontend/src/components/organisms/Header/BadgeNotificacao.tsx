import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificacoes } from '../../../hooks/useNotificacoes';

interface BadgeNotificacaoProps {
  tenantId: string | null;
}

export const BadgeNotificacao: React.FC<BadgeNotificacaoProps> = ({ tenantId }) => {
  const { notificacoes, limparNotificacoes } = useNotificacoes(tenantId);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
      >
        <Bell size={20} />
        {notificacoes.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
            {notificacoes.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 dark:text-white">Notificações</h3>
                <button 
                  onClick={limparNotificacoes}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar tudo
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm">Nenhuma notificação nova</p>
                  </div>
                ) : (
                  notificacoes.map((notificacao, index) => (
                    <div 
                      key={index}
                      className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full shrink-0" />
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {notificacao.mensagem}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notificacao.data).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
