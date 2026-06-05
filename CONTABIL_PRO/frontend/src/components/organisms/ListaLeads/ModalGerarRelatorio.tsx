import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, FileSpreadsheet, Calendar, Download, Loader2 } from 'lucide-react';
import { Botao } from '../../atoms/Botao/Botao';
import { Texto } from '../../atoms/Texto/Texto';
import { LeadService } from '../../../services/LeadService';

interface ModalGerarRelatorioProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: (mensagem: string) => void;
}

export const ModalGerarRelatorio: React.FC<ModalGerarRelatorioProps> = ({ aberto, onFechar, onSucesso }) => {
  const [formato, setFormato] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleGerar = async () => {
    setIsLoading(true);
    try {
      await LeadService.solicitarRelatorio({ formato, ...periodo });
      onSucesso("Seu relatório está sendo gerado e você será notificado em instantes!");
      onFechar();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Texto variant="subtitulo">Gerar Relatório de Leads</Texto>
                  <Texto variant="detalhe" className="text-slate-500 mt-1">Selecione o período e o formato desejado</Texto>
                </div>
                <button onClick={onFechar} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Formato */}
                <div>
                  <Texto variant="detalhe" className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-3 ml-1">Formato do Arquivo</Texto>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'PDF', icon: FileText, label: 'PDF', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                      { id: 'EXCEL', icon: FileSpreadsheet, label: 'Excel', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                      { id: 'CSV', icon: Download, label: 'CSV', color: 'text-blue-500', bg: 'bg-blue-500/10' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormato(f.id as any)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 transition-all ${formato === f.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <div className={`p-2 rounded-xl ${f.bg}`}>
                           <f.icon className={f.color} size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Período */}
                <div>
                   <Texto variant="detalhe" className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-3 ml-1">Período de Dados</Texto>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-tighter text-slate-500 ml-1">Início</label>
                        <div className="relative">
                          <input 
                            type="date" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            value={periodo.inicio}
                            onChange={(e) => setPeriodo(prev => ({ ...prev, inicio: e.target.value }))}
                          />
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-tighter text-slate-500 ml-1">Fim</label>
                        <div className="relative">
                          <input 
                            type="date" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            value={periodo.fim}
                            onChange={(e) => setPeriodo(prev => ({ ...prev, fim: e.target.value }))}
                          />
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-10">
                <Botao 
                  variant="primary" 
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                  onClick={handleGerar}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                  Solicitar Geração de Relatório
                </Botao>
                <Texto variant="detalhe" className="text-center mt-4 text-[10px] leading-relaxed text-slate-400 px-4">
                  O relatório será processado em segundo plano. Você será avisado assim que o download estiver disponível.
                </Texto>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
