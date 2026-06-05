import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';

interface DialogNovoProcessoProps {
  aberto: boolean;
  onFechar: () => void;
  // onSucesso: () => void; // Futuro
}

/**
 * Dialog básico para criação de um Novo Processo de legalização / alteração.
 * Atende ao requisito do Onboarding.
 */
export const DialogNovoProcesso: React.FC<DialogNovoProcessoProps> = ({ aberto, onFechar }) => {
  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-text-main placeholder:text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block";

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onFechar} 
            className="fixed inset-0 bg-black/50 z-[60]" 
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[61] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-y-auto pointer-events-auto bg-primary-bg border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                <div>
                  <Texto variant="subtitulo">Novo Processo Legal</Texto>
                  <Texto variant="detalhe" className="mt-0.5">Abertura / Alteração / Baixa</Texto>
                </div>
                <button onClick={onFechar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-text-secondary">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Nome da Empresa / Cliente</label>
                  <input className={inputClass} placeholder="Empresa Beta Ltda" />
                </div>
                <div>
                  <label className={labelClass}>Tipo de Processo</label>
                  <select className={inputClass}>
                    <option>Abertura de Empresa</option>
                    <option>Alteração Contratual</option>
                    <option>Baixa de CNPJ</option>
                    <option>Regularização Fiscal</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Órgão Principal</label>
                  <select className={inputClass}>
                    <option>Junta Comercial</option>
                    <option>Receita Federal</option>
                    <option>Prefeitura</option>
                    <option>Posto Fiscal</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Observações Iniciais</label>
                  <textarea className={inputClass + ' min-h-[80px]'} placeholder="Detalhes importantes para o analista legal..." />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t border-slate-200 dark:border-white/10 flex-shrink-0">
                <Botao onClick={onFechar} className="flex items-center gap-2">
                  <Send size={16} />
                  Cadastrar Processo
                </Botao>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
