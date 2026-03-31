import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface ConfirmacaoModalProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  onFechar: () => void;
  onConfirmar: () => void;
  textoConfirmar?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmacaoModal: React.FC<ConfirmacaoModalProps> = ({
  aberto,
  titulo,
  descricao,
  onFechar,
  onConfirmar,
  textoConfirmar = 'Confirmar',
  variant = 'danger',
  isLoading = false
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onFechar);

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/30';
      case 'warning': return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/30';
    }
  };

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border ${getVariantStyles()}`}>
                <AlertCircle size={24} />
              </div>
              <button onClick={onFechar} className="p-2 text-slate-400 hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>

            <Texto variant="subtitulo" className="mb-2">{titulo}</Texto>
            <Texto variant="corpo" className="text-text-secondary mb-8">{descricao}</Texto>

            <div className="flex flex-col sm:flex-row gap-3">
              <Botao variant="outline" onClick={onFechar} className="flex-1">
                Cancelar
              </Botao>
              <Botao 
                onClick={onConfirmar} 
                className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Aguarde...' : textoConfirmar}
              </Botao>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
