import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { LeadTable } from './LeadTable';
import type { LeadResponse } from '../../../hooks/useLeads';

interface StageLeadsModalProps {
  aberto: boolean;
  onFechar: () => void;
  etapa: { id: string; label: string; color: string; icon: any } | null;
  leads: LeadResponse[];
  isLoading: boolean;
  onView: (lead: LeadResponse) => void;
  onEdit: (lead: LeadResponse) => void;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, newStatus: string) => Promise<void>;
  onHistory: (lead: LeadResponse) => void;
}

export const StageLeadsModal: React.FC<StageLeadsModalProps> = ({
  aberto,
  onFechar,
  etapa,
  leads,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onMove,
  onHistory
}) => {
  if (!aberto || !etapa) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 ${etapa.color}`}>
                <etapa.icon size={24} />
              </div>
              <div>
                <Texto variant="titulo" className="text-xl">{etapa.label}</Texto>
                <Texto variant="detalhe" className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{leads.length}</span> 
                  leads nesta fase do funil
                </Texto>
              </div>
            </div>
            <button
              onClick={onFechar}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <LeadTable 
              leads={leads}
              isLoading={isLoading}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onHistory={onHistory}
            />
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 flex justify-end">
            <button 
              onClick={onFechar}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all text-sm"
            >
              Fechar Visualização
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
