import React, { useState, useRef, useEffect } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { 
  Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video, 
  Forward, XCircle, ChevronLeft, Clock, UserCheck, MessageSquare,
  Users, Info, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useChat } from '../../../hooks/useChat';

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
  };
  onFechar: () => void;
  onTransferir: () => void;
  onEncerrar: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ lead, onFechar, onTransferir, onEncerrar }) => {
  const { mensagens, loading } = useChat(lead.id);
  const [novoTexto, setNovoTexto] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, lead.id]);

  const handleEnviar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!novoTexto.trim()) return;

    // TODO: Chamar LeadService.enviarMensagemWhatsApp
    // Por enquanto, o backend disparará ao mudar o status ou manualmente via outra ação
    // Mas vamos simular localmente para feedback instantâneo ou confiar no WebSocket
    setNovoTexto('');
  };

  const renderBody = () => {
    switch (lead.tabType) {
      case 'fila':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden">
            {/* Background Decor */}
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

              <div>
                <Texto variant="titulo" className="text-2xl mb-2">Lead em Espera</Texto>
                <Texto variant="corpo" className="text-slate-500 dark:text-slate-400">
                  {lead.nome} está aguardando atendimento há <span className="font-black text-rose-500">{lead.espera}</span> para o departamento <span className="font-black text-blue-600 dark:text-blue-400">{lead.departamento}</span>.
                </Texto>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5">
                  <Texto variant="detalhe" className="text-[10px] uppercase font-black text-slate-400 mb-1">Empresa</Texto>
                  <Texto variant="corpo" className="font-bold truncate">{lead.empresa || 'Não informada'}</Texto>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5">
                  <Texto variant="detalhe" className="text-[10px] uppercase font-black text-slate-400 mb-1">Status</Texto>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                    <Texto variant="corpo" className="font-black text-rose-500 truncate">CRÍTICO</Texto>
                  </div>
                </div>
              </div>

              <Botao onClick={() => console.log('Iniciar Atendimento')} className="h-16 w-full text-lg shadow-xl shadow-blue-500/20 gap-3">
                <UserCheck size={24} /> Iniciar Atendimento
              </Botao>
            </motion.div>
          </div>
        );

      case 'contatos':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/20">
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="text-center space-y-8 max-w-sm"
            >
              <div className="w-32 h-32 bg-blue-600/5 text-blue-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare size={56} className="opacity-20 translate-y-2" />
              </div>
              
              <div>
                <Texto variant="titulo" className="text-2xl mb-3">Novo Atendimento</Texto>
                <Texto variant="corpo" className="text-slate-400 leading-relaxed">
                  Este é o início de uma nova conversa com <b>{lead.nome}</b>. Envie uma mensagem inicial para começar o diálogo.
                </Texto>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-full text-xs font-black text-blue-600 uppercase tracking-widest shadow-sm">
                <ShieldCheck size={14} /> Canal Seguro & Verificado
              </div>

              <div className="space-y-3 pt-4">
                <Texto variant="label" className="text-[10px] uppercase font-black text-slate-400 tracking-widest block text-left">Templates Sugeridos</Texto>
                <button 
                  onClick={() => setNovoTexto('Olá {nome}, vi que você ainda não iniciou seu processo. Como posso te ajudar hoje?')}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-left hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Zap size={14} className="text-amber-500" />
                    <Texto variant="corpo" className="text-sm font-bold group-hover:text-blue-500">Boas-vindas Padrão</Texto>
                  </div>
                  <Texto variant="detalhe" className="truncate opacity-50">"Olá {lead.nome}, vi que você ainda não iniciou..."</Texto>
                </button>
              </div>
            </motion.div>
          </div>
        );

      case 'grupos':
        return (
          <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950 scroll-smooth relative overflow-hidden">
             {/* Header do Grupo Interno */}
             <div className="p-4 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                   <Info size={14} />
                   <Texto variant="detalhe" className="text-[10px] uppercase font-black tracking-widest">Aviso: Mensagens de grupo são visíveis para todos os membros</Texto>
                </div>
                <Texto variant="detalhe" className="text-blue-500 font-bold">{lead.membros} Membros Ativos</Texto>
             </div>

             {/* Área de Mensagens (Reuse) */}
             {renderMessages()}
          </div>
        );

      default:
        return renderMessages();
    }
  };

  const renderMessages = () => (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100/50 dark:bg-slate-950 scroll-smooth relative"
      style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '24px 24px' }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 z-20 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <AnimatePresence>
        {mensagens.map((msg) => (
          <motion.div
            layout
            key={msg.id}
            initial={{ opacity: 0, x: msg.autor === 'cliente' ? -20 : 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className={`flex ${msg.autor === 'cliente' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`
              max-w-[80%] lg:max-w-[60%] p-4 rounded-2xl shadow-lg relative transition-all duration-300
              ${msg.autor === 'cliente' 
                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-tl-none' 
                : 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/20'}
            `}>
              <Texto variant="corpo" className={`leading-relaxed ${msg.autor === 'atendente' ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                {msg.texto}
              </Texto>
              <div className={`text-[10px] uppercase font-bold tracking-widest mt-2 flex items-center gap-1 ${msg.autor === 'atendente' ? 'text-blue-100' : 'text-slate-400'}`}>
                {msg.horario}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative z-0 h-full"
    >
      {/* Header do Chat Dinâmico */}
      <div className="p-4 lg:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={onFechar} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 lg:hidden">
            <ChevronLeft size={24} />
          </button>
          
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-white/10
            ${lead.tabType === 'grupos' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}
            text-white
          `}>
            {lead.tabType === 'grupos' ? <Users size={24} /> : lead.nome[0]}
          </div>

          <div>
            <Texto variant="titulo" className="text-lg mb-0.5 leading-none">{lead.nome}</Texto>
            <div className="flex items-center gap-2">
                {lead.tabType === 'fila' ? (
                   <>
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <Texto variant="detalhe" className="text-rose-500 font-bold uppercase tracking-wider text-[10px]">Aguardando Atendimento • {lead.espera}</Texto>
                   </>
                ) : lead.tabType === 'grupos' ? (
                    <>
                      <div className="flex -space-x-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border border-white dark:border-slate-900" />
                        ))}
                      </div>
                      <Texto variant="detalhe" className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{lead.membros} participantes</Texto>
                    </>
                ) : (
                   <>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <Texto variant="detalhe" className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Consultor Online</Texto>
                   </>
                )}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
            <button className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><Phone size={20} /></button>
            <button className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><Video size={20} /></button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button onClick={onTransferir} className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all" title="Transferir"><Forward size={20} /></button>
            <button onClick={onEncerrar} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" title="Encerrar"><XCircle size={20} /></button>
            <button className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Área Dinâmica (Mensagens / Fila / Novo Contato) */}
      {renderBody()}

      {/* Input de Mensagem (Oculto na Fila até aceitar) */}
      {lead.tabType !== 'fila' && (
        <form 
          onSubmit={handleEnviar}
          className="p-4 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 flex items-center gap-4 relative z-10"
        >
          <div className="flex items-center gap-1">
            <button type="button" className="p-3 text-slate-400 hover:text-blue-500 transition-colors"><Smile size={24} /></button>
            <button type="button" className="p-3 text-slate-400 hover:text-blue-500 transition-colors"><Paperclip size={24} /></button>
          </div>

          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Digite uma mensagem..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            {novoTexto.trim() ? (
              <motion.button 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                type="submit"
                className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-500 transition-all"
              >
                <Send size={24} />
              </motion.button>
            ) : (
               <button type="button" className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl transition-all">
                 <Mic size={24} />
               </button>
            )}
          </div>
        </form>
      )}
    </motion.div>
  );
};
