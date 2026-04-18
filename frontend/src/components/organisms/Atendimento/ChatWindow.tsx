import React, { useState, useRef, useEffect } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { Send, Forward, XCircle, Clock, UserCheck, MessageSquare, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { WaitTimer } from '../../atoms/WaitTimer/WaitTimer';

import { useChat } from '../../../hooks/useChat';
import { LeadService } from '../../../services/LeadService';
import { useResolucao } from '../../../contexts/ResolucaoContext';

interface ChatWindowProps {
  lead: {
    id: string;
    nome: string;
    empresa?: string;
    whatsapp?: string;
    tabType: 'chats' | 'fila' | 'contatos' | 'grupos';
    espera?: string;
    departamento?: string;
    membros?: number;
    transferido?: boolean;
    restritoAdmin?: boolean;
  };
  onFechar: () => void;
  onTransferir: () => void;
  onEncerrar: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ lead, onTransferir, onEncerrar }) => {
  const { mensagens } = useChat(lead.id);
  const [isAceitando, setIsAceitando] = useState(false);
  const [novoTexto, setNovoTexto] = useState('');
  const [isNotaInterna, setIsNotaInterna] = useState(false);
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, lead.id]);

  // Reset state when lead changes
  useEffect(() => {
    setIsAceitando(false);
    setNovoTexto('');
  }, [lead.id]);

  const handleEnviar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!novoTexto.trim()) return;

    try {
      await LeadService.enviarMensagem(lead.id, {
        conteudo: novoTexto,
        tipo: isNotaInterna ? 'INTERNA' : 'EXTERNA'
      });
      setNovoTexto('');
      setIsNotaInterna(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Falha ao enviar mensagem.');
    }
  };

  const handleToggleVisibilidade = async (mensagemId: string, visivelAtual: boolean) => {
    try {
      await LeadService.atualizarVisibilidadeMensagem(mensagemId, !visivelAtual);
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
    }
  };

  const renderBody = () => {
    if (isAceitando || lead.tabType === 'chats') {
      return renderMessages();
    }

    switch (lead.tabType) {
      case 'fila':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <Clock className="w-96 h-96 -top-20 -left-20 absolute rotate-12" />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-white/5 text-center space-y-8 z-10"
            >
              <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-500/5">
                <Clock size={48} className="animate-pulse" />
              </div>

              <div className="space-y-4">
                <Texto variant="titulo" className="text-2xl mb-2">Lead em Espera</Texto>
                <div className="flex flex-col items-center gap-2">
                  <Texto variant="corpo" className="text-slate-400">
                    {lead.nome} está aguardando atendimento
                  </Texto>
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20 w-fit">
                    <div className="text-2xl font-black text-rose-600 flex items-center gap-2">
                      <WaitTimer startTimeStr={lead.espera} onlyTimeText={true} />
                    </div>
                  </div>
                  <Texto variant="corpo" className="text-slate-400">
                    para o setor <span className="font-bold text-blue-600">{lead.departamento || 'Comercial'}</span>.
                  </Texto>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5">
                  <Texto variant="detalhe" className="text-[10px] uppercase font-black text-slate-400 mb-1">Empresa</Texto>
                  <Texto variant="corpo" className="font-bold truncate">{lead.empresa || 'Não informada'}</Texto>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5">
                  <Texto variant="detalhe" className="text-[10px] uppercase font-black text-slate-400 mb-1">Status SLA</Texto>
                  <WaitTimer startTimeStr={lead.espera} showStatus />
                </div>
              </div>

              <Botao
                onClick={async () => {
                  try {
                    setIsAceitando(true);
                    await LeadService.aceitarAtendimento(lead.id);
                    window.dispatchEvent(new CustomEvent('reload-contacts'));
                    window.dispatchEvent(new CustomEvent('atendimento-aceito', { detail: { leadId: lead.id } }));
                  } catch (e) {
                    setIsAceitando(false);
                    alert('Falha ao iniciar atendimento.');
                  }
                }}
                className="h-16 w-full text-lg shadow-xl shadow-blue-500/20 gap-3"
              >
                <UserCheck size={24} /> Iniciar Atendimento
              </Botao>
            </motion.div>
          </div>
        );

      case 'contatos':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/20">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center space-y-8 max-w-sm">
              <div className="w-32 h-32 bg-blue-600/5 text-blue-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare size={56} className="opacity-20 translate-y-2" />
              </div>
              <div>
                <Texto variant="titulo" className="text-2xl mb-3">Novo Atendimento</Texto>
                <Texto variant="corpo" className="text-slate-400">Comece uma conversa enviando uma mensagem para <b>{lead.nome}</b>.</Texto>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-full text-xs font-black text-blue-600 uppercase tracking-widest shadow-sm">
                <ShieldCheck size={14} /> Canal Seguro & Verificado
              </div>
            </motion.div>
          </div>
        );

      default:
        return renderMessages();
    }
  };

  const renderMessages = () => (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100/50 dark:bg-slate-950 relative">
      <AnimatePresence>
        {mensagens.map((msg) => (
          <motion.div layout key={msg.id} className={`flex ${msg.autor === 'cliente' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${msg.autor === 'cliente' ? 'bg-white dark:bg-slate-800 border dark:border-white/5 text-slate-800 dark:text-slate-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'}`}>
              <Texto variant="corpo">{msg.texto}</Texto>
              <div className="text-[10px] mt-1 opacity-50 uppercase font-bold">{msg.horario}</div>
            </div>
          </motion.div>
        ))}
        {isAceitando && mensagens.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full opacity-50">
            <Texto variant="detalhe" className="animate-pulse">Iniciando conversa...</Texto>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative h-full">
      <div className="p-4 lg:p-6 border-b dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">{lead.nome[0]}</div>
          <div>
            <Texto variant="titulo" className="text-lg mb-0.5">{lead.nome}</Texto>
            <div className="flex items-center gap-2">
              {(lead.tabType === 'fila' && !isAceitando) ? (
                <Texto variant="detalhe" className="text-rose-500 font-bold uppercase text-[10px]">Aguardando Atendimento</Texto>
              ) : (
                <Texto variant="detalhe" className="text-emerald-500 font-bold uppercase text-[10px]">Consultor Online</Texto>
              )}
            </div>
          </div>
          {lead.transferido && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <ArrowRightLeft size={12} className="text-amber-600" />
              <Texto variant="detalhe" className="text-[10px] font-black uppercase text-amber-600">Atendimento Transferido</Texto>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onTransferir} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><Forward size={20} /></button>
          <button onClick={onEncerrar} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><XCircle size={20} /></button>
        </div>
      </div>
      {renderBody()}
      {(lead.tabType !== 'fila' || isAceitando) && (
        <form onSubmit={handleEnviar} className="p-4 border-t dark:border-white/5 flex items-center gap-3 bg-white dark:bg-slate-900">
          <input
            type="text"
            className="flex-1 rounded-2xl p-4 outline-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-transparent focus:border-blue-500/50 dark:focus:border-blue-400/50 transition-all"
            placeholder="Digite sua mensagem..."
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
          />
          <div className="flex items-center justify-center">
            <Botao type="submit" className="h-10 w-10  rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Send size={18} />
            </Botao>
          </div>
        </form>
      )}
    </motion.div>
  );
};
