import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormularioLogin } from '../../components/organisms/FormularioLogin/FormularioLogin';
import { LinkTexto } from '../../components/atoms/LinkTexto/LinkTexto';
import { Activity, AlertCircle } from 'lucide-react';
import { useGlobalErrorStore } from '../../store/globalErrorStore';

export const Login: React.FC = () => {
  const { hasError, message } = useGlobalErrorStore();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 xs:p-2 relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      {/* Background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main glass card mobile first */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card w-full max-w-sm p-8 xs:p-5 xs:rounded-xl text-center z-10 mx-auto"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-6 shadow-inner border border-white/5 xs:w-12 xs:h-12 xs:mb-4">
          <Activity className="w-7 h-7 text-blue-400 xs:w-6 xs:h-6" />
        </div>
        
        <h1 className="font-display font-bold text-2xl mb-2 xs:text-xl text-white">
          Início de Sessão
        </h1>
        
        <p className="font-sans text-slate-300 text-sm mb-6 leading-relaxed xs:text-xs xs:mb-5">
          Conecte-se para gerenciar seus clientes, alvarás e obrigações unificados.
        </p>

        <FormularioLogin />

        <div className="mt-6 flex flex-col items-center gap-2 xs:mt-5">
          <span className="text-slate-400 text-sm xs:text-xs">
            Ainda não é nosso cliente?
          </span>
          <LinkTexto href="/cadastro">
            Crie sua conta agora
          </LinkTexto>
        </div>
      </motion.div>

      {/* Global Toast for Errors */}
      <AnimatePresence>
        {hasError && message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-6 xs:top-3 z-50 glass-card bg-amber-500/10 border-amber-500/40 text-amber-200 px-6 py-3 xs:px-4 xs:py-2 flex items-center gap-3 w-[90%] max-w-sm rounded-[1rem]"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
