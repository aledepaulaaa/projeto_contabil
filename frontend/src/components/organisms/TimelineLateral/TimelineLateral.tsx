import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Circle, Clock } from 'lucide-react';
import { useHistoricoLead } from '../../../hooks/useHistoricoLead';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';
import { Skeleton } from '../../atoms/Skeleton/Skeleton';
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

/**
 * Sidebar direita expansível que exibe o histórico de "Vida" do Lead.
 * Marcadores: Verde (Sucesso), Amarelo (Atenção), Cinza (Neutro).
 * Consome o endpoint /api/leads/{id}/historico via useHistoricoLead.
 */
export const TimelineLateral: React.FC<TimelineLateralProps> = ({ leadId, nomeContato, aberta, onFechar }) => {
  const { eventos, isLoading } = useHistoricoLead(aberta ? leadId : null);

  return (
    <AnimatePresence>
      {aberta && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-primary-bg border-l border-slate-200 dark:border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
              <div>
                <Texto variant="subtitulo">Timeline do Lead</Texto>
                <Texto variant="detalhe" className="mt-1">{nomeContato}</Texto>
              </div>
              <button
                onClick={onFechar}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : eventos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <Clock className="w-12 h-12 mb-4 text-text-secondary" />
                  <Texto variant="corpo" className="font-medium">Nenhum evento registrado</Texto>
                  <Texto variant="detalhe">O histórico será preenchido conforme o Lead avança no funil.</Texto>
                </div>
              ) : (
                <div className="relative">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200 dark:bg-white/10" />

                  <div className="space-y-6">
                    {eventos.map((evento: EventoHistorico, index: number) => {
                      const config = marcadorConfig[evento.marcador] || marcadorConfig.NEUTRO;
                      const IconComponent = config.icon;

                      return (
                        <motion.div
                          key={evento.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="flex gap-4 relative"
                        >
                          {/* Marcador */}
                          <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${config.bgCor} transition-colors`}>
                            <IconComponent className={config.cor} size={16} />
                          </div>

                          {/* Conteúdo */}
                          <Card variant="flat" className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <Texto variant="corpo" className="font-semibold text-sm">{evento.tipo.replace(/_/g, ' ')}</Texto>
                              <Texto variant="detalhe" className="text-[10px] shrink-0">
                                {new Date(evento.ocorridoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </Texto>
                            </div>
                            <Texto variant="detalhe" className="mt-1">{evento.descricao}</Texto>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
