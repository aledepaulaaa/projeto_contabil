import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, UserPlus, ExternalLink, CheckCircle } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { useGoogleAds } from '../../../hooks/useGoogleAds';
import { IconeGoogleAds } from '../../atoms/Icons/IconeGoogleAds';

interface ModalSelecaoOrigemLeadProps {
  aberto: boolean;
  onFechar: () => void;
  onSelecionarManual: () => void;
  onSelecionarImportar: () => void;
}

export const ModalSelecaoOrigemLead: React.FC<ModalSelecaoOrigemLeadProps> = ({ aberto, onFechar, onSelecionarManual, onSelecionarImportar }) => {
  const { status, conectar } = useGoogleAds();
  const isConectado = status?.connected || false;

  const opcoes = [
    {
      id: 'google',
      label: 'Google Ads',
      desc: isConectado ? 'Sua conta está conectada e os leads estão sendo capturados.' : 'Sincronização automática via API',
      icon: isConectado ? CheckCircle : IconeGoogleAds,
      cor: isConectado ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600',
      disabled: false,
      tag: isConectado ? 'Ativo' : 'Conectar',
      onClick: () => {
        if (!isConectado) {
          conectar();
        } else {
          // Futuro: Gerenciar Conexão
          alert('Integração ativa! Os leads estão sendo sincronizados automaticamente.');
        }
      }
    },
    {
      id: 'import',
      label: 'Importar Excel/CSV',
      desc: 'Upload em massa de contatos',
      icon: Upload,
      cor: 'bg-indigo-500/10 text-indigo-600',
      disabled: false,
      onClick: onSelecionarImportar
    },
    {
      id: 'manual',
      label: 'Entrada Manual',
      desc: 'Cadastrar lead individualmente',
      icon: UserPlus,
      cor: 'bg-indigo-500/10 text-indigo-600',
      disabled: false,
      onClick: onSelecionarManual
    }
  ];

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] h-full"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg pointer-events-auto bg-primary-bg border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <Texto variant="titulo" className="text-2xl">Novo Lead</Texto>
                    <Texto variant="detalhe" className="mt-1">Como você deseja adicionar este lead?</Texto>
                  </div>
                  <button onClick={onFechar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-text-secondary">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {opcoes.map((op) => (
                    <button
                      key={op.id}
                      onClick={op.onClick}
                      disabled={op.disabled}
                      className={`
                        w-full p-5 rounded-2xl border-2 text-left transition-all relative group
                        ${op.disabled
                          ? 'opacity-50 grayscale border-slate-100 dark:border-slate-800 cursor-not-allowed'
                          : 'border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/[0.02]'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${op.cor}`}>
                          <op.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Texto variant="corpo" className="font-bold">{op.label}</Texto>
                            {op.tag && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-text-secondary">
                                {op.tag}
                              </span>
                            )}
                          </div>
                          <Texto variant="detalhe" className="text-xs group-hover:text-text-main transition-colors">
                            {op.desc}
                          </Texto>
                        </div>
                        {!op.disabled && <ExternalLink size={16} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                  <Texto variant="detalhe" className="text-center italic">
                    "Otimize seu tempo centralizando todas as origens em um único funil."
                  </Texto>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
