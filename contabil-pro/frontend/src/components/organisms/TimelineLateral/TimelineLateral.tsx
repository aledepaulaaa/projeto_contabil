import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Circle, 
  Clock, 
  Trash2, 
  Archive, 
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ArchiveRestore
} from 'lucide-react';
import { useHistoricoLead } from '../../../hooks/useHistoricoLead';
import { useLeads } from '../../../hooks/useLeads';
import { Texto } from '../../atoms/Texto/Texto';
import { ConfirmacaoModal } from '../../molecules/ConfirmacaoModal/ConfirmacaoModal';
import type { EventoHistorico } from '../../../services/LeadService';

interface TimelineLateralProps {
  leadId: string | null;
  nomeContato: string;
  aberta: boolean;
  onFechar: () => void;
}

const marcadorConfig: Record<string, { icon: React.FC<{ className?: string; size?: number }>, cor: string, bgCor: string }> = {
  SUCESSO: { icon: CheckCircle2, cor: 'text-emerald-600 dark:text-emerald-400', bgCor: 'bg-emerald-500/10 border-emerald-500/30' },
  ATENCAO: { icon: AlertTriangle, cor: 'text-amber-600 dark:text-amber-400', bgCor: 'bg-amber-500/10 border-amber-500/30' },
  NEUTRO: { icon: Circle, cor: 'text-slate-500 dark:text-slate-400', bgCor: 'bg-slate-500/10 border-slate-500/30' },
};

export const TimelineLateral: React.FC<TimelineLateralProps> = ({ leadId, nomeContato, aberta, onFechar }) => {
  const { eventos, isLoading, refreshHistorico, arquivado } = useHistoricoLead(aberta ? leadId : null);
  const { clearHistory, archiveHistory, exportCsv, exportPdf, exportarGeralCsv, exportarGeralPdf } = useLeads();
  const [confirmLimpar, setConfirmLimpar] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleLimpar = async () => {
    setIsActionLoading(true);
    try {
      await clearHistory(leadId);
      refreshHistorico();
      setConfirmLimpar(false);
    } catch (e) {
      console.error('Erro ao limpar histórico', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleArquivar = async () => {
    if (!leadId) return;
    try {
      await archiveHistory({ id: leadId, arquivar: !arquivado });
      refreshHistorico();
    } catch (e) {
      console.error('Erro ao alterar status de arquivamento', e);
    }
  };

  return (
    <AnimatePresence>
      {aberta && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="fixed inset-0 bg-black/40 z-[400]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 z-[1002] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Texto variant="subtitulo">Timeline do Lead</Texto>
                  {arquivado && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 text-[9px] font-bold rounded-full uppercase tracking-tighter border border-amber-500/30">
                      Arquivado
                    </span>
                  )}
                </div>
                <Texto variant="detalhe" className="mt-1 text-slate-500 font-bold truncate text-base">{nomeContato}</Texto>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => refreshHistorico()} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={onFechar}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => leadId ? exportCsv(leadId) : exportarGeralCsv()}
                  className="px-3 py-1.5 flex items-center gap-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                  title="Exportar CSV/Excel"
                >
                  <FileSpreadsheet size={16} />
                  <span className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md">Excel / CSV</span>
                </button>
                <button 
                  onClick={() => leadId ? exportPdf(leadId) : exportarGeralPdf()}
                  className="px-3 py-1.5 flex items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                  title="Exportar PDF"
                >
                  <FileText size={16} />
                  <span className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-rose-500/10 text-rose-600 rounded-md">PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleArquivar}
                  className={`p-2 rounded-lg transition-all ${arquivado ? 'text-amber-600 bg-amber-500/10' : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50 hover:dark:bg-amber-900/20'}`}
                  title={arquivado ? 'Desarquivar' : 'Arquivar'}
                >
                  {arquivado ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                </button>
                <button 
                  onClick={() => setConfirmLimpar(true)}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Limpar Histórico"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-900 animate-pulse w-3/4 rounded" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-900 animate-pulse w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : eventos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <Texto variant="corpo" className="font-semibold text-slate-600">Timeline Vazia</Texto>
                  <Texto variant="detalhe" className="max-w-[200px] mt-1 text-slate-500">
                    O histórico registrará cada movimento deste lead automaticamente.
                  </Texto>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200 dark:bg-white/10" />

                  <div className="space-y-6">
                    {eventos.map((evento: EventoHistorico, index: number) => {
                      const config = marcadorConfig[evento.marcador] || marcadorConfig.NEUTRO;
                      const IconComponent = config.icon;

                      return (
                        <motion.div
                          key={evento.id || index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-4 relative"
                        >
                          <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${config.bgCor} transition-colors bg-white dark:bg-slate-950`}>
                            <IconComponent className={config.cor} size={16} />
                          </div>

                          <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <Texto variant="corpo" className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                {evento.tipo.replace(/_/g, ' ')}
                              </Texto>
                              <Texto variant="detalhe" className="text-[9px] text-slate-400 font-medium shrink-0">
                                {new Date(evento.ocorridoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                <span className="mx-1">•</span>
                                {new Date(evento.ocorridoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </Texto>
                            </div>
                            <Texto variant="corpo" className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic font-medium">
                                "{evento.descricao}"
                            </Texto>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>

          <ConfirmacaoModal 
             aberto={confirmLimpar}
             titulo="Limpar Histórico?"
             descricao="Esta ação removerá todos os registros de interações deste lead permanentemente. Somente o evento de limpeza será mantido."
             onFechar={() => setConfirmLimpar(false)}
             onConfirmar={handleLimpar}
             isLoading={isActionLoading}
          />
        </>
      )}
    </AnimatePresence>
  );
};
