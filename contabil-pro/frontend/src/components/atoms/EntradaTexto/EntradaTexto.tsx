import React, { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { theme } from '../../../theme';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntradaTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const EntradaTexto: React.FC<EntradaTextoProps> = ({ label, id, type, ...props }) => {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const isPassword = type === 'password';

  const toggleVisibilidade = () => setMostrarSenha(!mostrarSenha);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative group">
        <input
          id={id}
          type={isPassword ? (mostrarSenha ? 'text' : 'password') : type}
          className={`w-full px-4 py-3 xs:py-2.5 xs:text-sm ${theme.glass.input} outline-none transition-all duration-200 bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pr-12`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={toggleVisibilidade}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mostrarSenha ? 'eye' : 'eye-off'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
    </div>
  );
};
