import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Download, Clock, FileText, FileSpreadsheet, X } from 'lucide-react';
import { LeadService, type NotificacaoDownload } from '../../../services/LeadService';
import { Texto } from '../../atoms/Texto/Texto';

export const NotificationCenter: React.FC = () => {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoDownload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificacoes = async () => {
    try {
      const data = await LeadService.listarNotificacoes();
      setNotificacoes(data);
      setUnreadCount(data.filter(n => !n.lido).length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 10000); // Polling a cada 10s para simular tempo real
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (n: NotificacaoDownload) => {
    try {
      // Simulação: o arquivo no servidor não existe de verdade, 
      // então criamos um blob falso para demonstração se a requisição falhar
      try {
        await LeadService.baixarArquivo(n.urlDownload, `${n.nomeArquivo}.${n.formato.toLowerCase()}`);
      } catch (e) {
        console.warn('Simulando download já que o arquivo real não existe no servidor físico');
        const blob = new Blob(['Simulação de conteúdo do relatório'], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${n.nomeArquivo}.${n.formato.toLowerCase()}`;
        a.click();
      }
      
      if (!n.lido) {
        await LeadService.marcarNotificacaoLido(n.id);
        fetchNotificacoes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setAberto(!aberto)}
        className="relative p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
      >
        <Bell size={20} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {aberto && (
          <>
            <div className="fixed inset-0 z-[199]" onClick={() => setAberto(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[200] overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <Texto variant="detalhe" className="font-black uppercase tracking-widest text-slate-500">Notificações</Texto>
                <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
              </div>

              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {notificacoes.length === 0 ? (
                  <div className="p-10 text-center opacity-40">
                    <Clock size={32} className="mx-auto mb-3" />
                    <Texto variant="detalhe">Nenhuma atividade recente</Texto>
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleDownload(n)}
                      className={`w-full p-4 flex gap-4 text-left border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all ${!n.lido ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.formato === 'PDF' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {n.formato === 'PDF' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <Texto variant="corpo" className="font-bold text-[11px] truncate">{n.nomeArquivo}</Texto>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shrink-0 ${n.formato === 'PDF' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {n.formato}
                          </span>
                          {!n.lido && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
                        </div>
                        <Texto variant="detalhe" className="text-[10px] text-slate-500 mt-0.5">Relatório disponível para download</Texto>
                        <div className="flex items-center gap-1.5 mt-2">
                           <span className="text-[9px] font-black uppercase tracking-tighter text-blue-600 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                              <Download size={10} /> Baixar {n.formato}
                           </span>
                           <span className="text-[9px] text-slate-400">{new Date(n.geradoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {notificacoes.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Texto variant="detalhe" className="text-[9px] uppercase font-bold text-slate-400">Clique para baixar o arquivo</Texto>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
