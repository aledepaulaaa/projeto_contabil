import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import { TimelineLateral } from '../../organisms/TimelineLateral/TimelineLateral';

export const FloatingHistoryIndicator: React.FC = () => {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[1001]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAberto(true)}
          className="group relative p-4 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white"
        >
          <History size={24} />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            Histórico Recente
          </div>

          {/* Badge de Atividade (Simulado ou real vindo de store) */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
        </motion.button>
      </div>

      <TimelineLateral 
        leadId={null} // Sem lead fixo, mostra geral ou o último histórico
        nomeContato="Histórico Geral"
        aberta={aberto}
        onFechar={() => setAberto(false)}
      />
    </>
  );
};
