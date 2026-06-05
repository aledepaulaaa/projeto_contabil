import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useGlobalErrorStore } from '../../../store/globalErrorStore';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';

/**
 * Modal de erro global que exibe mensagens amigáveis.
 * Silencia detalhes técnicos — não expõe protocolos ou stack traces.
 */
export const ModalErroGlobal: React.FC = () => {
  const { hasError, clearError } = useGlobalErrorStore();

  return (
    <AnimatePresence>
      {hasError && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearError}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[61] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-primary-bg border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-8 pointer-events-auto relative"
            >
              <button
                onClick={clearError}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-main transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>

                <Texto variant="subtitulo">Ops! Algo deu errado</Texto>
                <Texto variant="corpo" className="text-text-secondary leading-relaxed font-medium">
                  Ocorreu um erro interno. Nossa equipe técnica já foi notificada e resolverá o problema em breve.
                </Texto>

                <Botao onClick={clearError} className="w-full mt-4">
                  Entendi
                </Botao>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
