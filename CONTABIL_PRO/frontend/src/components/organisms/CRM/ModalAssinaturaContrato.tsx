import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalAssinaturaContratoProps {
  isOpen: boolean;
  onClose: () => void;
  urlAssinatura: string;
  nomeLead: string;
}

export const ModalAssinaturaContrato: React.FC<ModalAssinaturaContratoProps> = ({
  isOpen,
  onClose,
  urlAssinatura,
  nomeLead
}) => {
  const [assinado, setAssinado] = useState(false);

  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="bg-white dark:bg-slate-900 w-full max-w-6xl my-4 sm:my-8 h-full sm:h-[85vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Assinatura de Contrato - {nomeLead}
                {assinado && <CheckCircle2 className="text-green-500" size={20} />}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modelo Oficial de Prestação de Serviços Contábeis - Supreme
              </p>
            </div>
            <div className="flex items-center gap-2">
              {assinado && (
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  onClick={() => window.open(urlAssinatura.replace('/verificar/', '/baixar/'), '_blank')}
                >
                  <Download size={16} />
                  Baixar Assinado
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Iframe Container */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative min-h-[600px] sm:min-h-[700px]">
            <iframe
              src={urlAssinatura}
              className="w-full h-full border-none shadow-inner block"
              style={{ height: 'calc(100% + 1px)' }}
              title="Assinatura ZapSign"
              onLoad={() => console.log('ZapSign Loaded')}
            />
            
            {/* Overlay de Simulação de Sucesso (Apenas para Dev/Mock) */}
            {!assinado && urlAssinatura && urlAssinatura.includes('mock') && (
               <div className="absolute bottom-4 left-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-500 flex items-center gap-4 animate-bounce">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    [MODO DESENVOLVEDOR] Simular assinatura concluída?
                  </p>
                  <button 
                    onClick={() => setAssinado(true)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-bold"
                  >
                    Simular Sucesso
                  </button>
               </div>
            )}
          </div>

          {/* Footer Informacional */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/50">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                Tecnologia OneClick ZapSign <ExternalLink size={10} /> Segurança Jurídica Garantida
             </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
