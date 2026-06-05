import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';

interface ModalObservacaoNaoFechamentoProps {
  aberto: boolean;
  nomeContato: string;
  onConfirmar: (observacao: string) => void;
  onFechar: () => void;
}

export const ModalObservacaoNaoFechamento: React.FC<ModalObservacaoNaoFechamentoProps> = ({
  aberto,
  nomeContato,
  onConfirmar,
  onFechar,
}) => {
  const [observacao, setObservacao] = useState('');

  if (!aberto) return null;

  const handleConfirmar = () => {
    if (observacao.trim()) {
      onConfirmar(observacao.trim());
      setObservacao('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <Texto variant="corpo" className="font-bold">Motivo do Não Fechamento</Texto>
                <Texto variant="detalhe" className="text-slate-500">
                  Lead: <span className="font-bold text-rose-600">{nomeContato}</span>
                </Texto>
              </div>
            </div>
            <button
              onClick={onFechar}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              <X size={18} />
            </button>
          </div>
          {/* Body */}
          <div className="p-6 space-y-4">
            <Texto variant="detalhe" className="text-slate-500">
              Descreva o motivo pelo qual este lead não fechou. Esta observação ficará registrada no histórico.
            </Texto>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Preço fora do orçamento, optou por outro escritório..."
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-rose-500/30 transition-all resize-none"
              autoFocus
            />
          </div>
          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
            <Botao variant="outline" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao
              variant="primary"
              onClick={handleConfirmar}
              className={`bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 ${!observacao.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!observacao.trim()}
            >
              Confirmar Não Fechamento
            </Botao>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
