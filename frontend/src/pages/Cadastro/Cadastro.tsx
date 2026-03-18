import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormularioCadastro } from '../../components/organisms/FormularioCadastro/FormularioCadastro';
import { LinkTexto } from '../../components/atoms/LinkTexto/LinkTexto';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useGlobalErrorStore } from '../../store/globalErrorStore';

export const Cadastro: React.FC = () => {
  const { hasError, message } = useGlobalErrorStore();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 xs:p-2 relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      {/* Background orbs */}
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Glass card container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-lg p-8 xs:p-5 xs:rounded-xl z-10"
      >
        <div className="flex flex-col items-center mb-8 xs:mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-inner border border-white/5 xs:w-12 xs:h-12">
            <UserPlus className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="font-display font-bold text-2xl xs:text-xl text-white">
            Criar Nova Conta
          </h1>
          <p className="font-sans text-slate-300 text-sm mt-2 text-center xs:text-xs">
            Junte-se a centenas de empresas que gerenciam sua contabilidade conosco.
          </p>
        </div>

        <FormularioCadastro />

        <div className="mt-8 flex justify-center items-center gap-2 xs:mt-6">
          <span className="text-slate-400 text-sm xs:text-xs">
            Já possui acesso?
          </span>
          <LinkTexto href="/login">
            Faça login aqui
          </LinkTexto>
        </div>
      </motion.div>

      {/* Global Error Toast */}
      <AnimatePresence>
        {hasError && message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-6 xs:top-3 z-50 glass-card bg-amber-500/10 border-amber-500/40 text-amber-200 px-6 py-3 xs:px-4 xs:py-2 flex items-center gap-3 w-[90%] max-w-sm rounded-2xl"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
