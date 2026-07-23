import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, FileSignature, Users } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { LeadTable } from './LeadTable';
import type { LeadResponse } from '../../../hooks/useLeads';
import { ModalAssinaturaContrato } from '../CRM/ModalAssinaturaContrato';

interface StageLeadsModalProps {
  aberto: boolean;
  onFechar: () => void;
  etapa: { id: string; label: string; color?: string; icon?: any } | null;
  leads: LeadResponse[];
  isLoading: boolean;
  onView: (lead: LeadResponse) => void;
  onEdit: (lead: LeadResponse) => void;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, newStatus: string) => Promise<void>;
  onHistory: (lead: LeadResponse) => void;
  onGerarContrato?: (leadId: string) => void;
  onRetryContrato?: (contratoId: string) => Promise<void>;
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
  onHistory,
  onGerarContrato,
}) => {
  const [modalAssinatura, setModalAssinatura] = React.useState<{
    isOpen: boolean;
    url: string;
    nome: string;
  }>({ isOpen: false, url: '', nome: '' });

  // Ref para evitar abrir o mesmo contrato múltiplas vezes automaticamente
  const autoOpenedRefs = useRef<Set<string>>(new Set());

  // Efeito de Auto-Abertura: Quando um contrato é gerado com sucesso, abre o modal
  useEffect(() => {
    if (!aberto || etapa?.id !== 'FECHAMENTO') return;

    leads.forEach(lead => {
      if (lead.contratoUrl && lead.contratoStatus === 'AGUARDANDO_ASSINATURA' && !autoOpenedRefs.current.has(lead.id)) {
        autoOpenedRefs.current.add(lead.id);
        setModalAssinatura({
          isOpen: true,
          url: lead.contratoUrl,
          nome: lead.nomeContato
        });
      }
    });
  }, [leads, aberto, etapa]);

  if (!aberto || !etapa) return null;

  const IconeEtapa = etapa.icon || Users;

  return (
    <>
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
              <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 ${etapa.color || 'text-blue-600'}`}>
                <IconeEtapa size={24} />
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
            {/* NAO_FECHOU: Exibir observações abaixo da tabela */}
            {etapa.id === 'NAO_FECHOU' && leads.some(l => l.observacaoNaoFechamento) && (
              <div className="mt-6 space-y-3">
                <Texto variant="detalhe" className="font-bold text-rose-500 uppercase tracking-wider">
                  Observações de Não Fechamento
                </Texto>
                {leads.filter(l => l.observacaoNaoFechamento).map(lead => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-4"
                  >
                    <Texto variant="corpo" className="font-bold text-sm mb-1">{lead.nomeContato}</Texto>
                    <Texto variant="detalhe" className="text-rose-600 dark:text-rose-400 italic">
                      "{lead.observacaoNaoFechamento}"
                    </Texto>
                  </motion.div>
                ))}
              </div>
            )}
            {/* FECHAMENTO: Exibir status do contrato abaixo da tabela */}
            {etapa.id === 'FECHAMENTO' && leads.length > 0 && (
              <div className="mt-6 space-y-3">
                <Texto variant="detalhe" className="font-bold text-emerald-500 uppercase tracking-wider">
                  Status dos Contratos
                </Texto>
                {leads.map(lead => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <Texto variant="corpo" className="font-bold text-sm">{lead.nomeContato}</Texto>
                      {lead.contratoUrl && (
                        <div className="flex items-center gap-2 mt-1">
                          <FileSignature size={14} className="text-orange-500" />
                          <Texto variant="detalhe" className="text-orange-500 font-bold">Documento pronto para assinatura</Texto>
                        </div>
                      )}
                      {!lead.contratoUrl && lead.contratoStatus === 'GERANDO' && (
                        <div className="flex items-center gap-2 mt-1">
                          <Loader2 size={14} className="animate-spin text-amber-500" />
                          <Texto variant="detalhe" className="text-amber-600 dark:text-amber-400">
                            Contrato sendo gerado... disponível em breve
                          </Texto>
                        </div>
                      )}
                      {!lead.contratoUrl && lead.contratoStatus === 'ERRO' && (
                        <div className="flex items-center gap-2 mt-1">
                          <AlertCircle size={14} className="text-rose-500" />
                          <Texto variant="detalhe" className="text-rose-500">
                            Houve um erro na geração inicial. Tente manualmente.
                          </Texto>
                        </div>
                      )}
                      {!lead.contratoId && !lead.contratoUrl && (
                        <div className="flex items-center gap-2 mt-1">
                          <Loader2 size={14} className="animate-spin text-amber-500" />
                          <Texto variant="detalhe" className="text-amber-600 dark:text-amber-400">
                            Processando provisionamento...
                          </Texto>
                        </div>
                      )}
                      {lead.contratoStatus === 'ATIVO' && (
                        <Texto variant="detalhe" className="text-emerald-600 mt-1 font-bold">✓ Contrato ativo</Texto>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Botão Gerar só aparece se houver erro definitivo (Retry manual) */}
                      {/* Se não houver ID, assumimos que o automático está rodando e não mostramos o botão azul para evitar duplicidade */}
                      {lead.status === 'FECHAMENTO' && lead.contratoStatus === 'ERRO' && onGerarContrato && (
                        <button
                          onClick={() => onGerarContrato(lead.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                        >
                          <FileSignature size={14} /> Tentar Novamente
                        </button>
                      )}
                      {lead.contratoUrl && lead.contratoStatus === 'AGUARDANDO_ASSINATURA' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(lead.contratoUrl!, '_blank')}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            title="Abrir em nova aba"
                          >
                            <X size={16} className="rotate-45" /> 
                          </button>
                          <button
                            onClick={() => setModalAssinatura({ 
                              isOpen: true, 
                              url: lead.contratoUrl!, 
                              nome: lead.nomeContato 
                            })}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                          >
                            <FileSignature size={14} /> Assinar Agora
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
    
    <ModalAssinaturaContrato 
      isOpen={modalAssinatura.isOpen}
      onClose={() => setModalAssinatura({ ...modalAssinatura, isOpen: false })}
      urlAssinatura={modalAssinatura.url}
      nomeLead={modalAssinatura.nome}
    />
    </>
  );
};
