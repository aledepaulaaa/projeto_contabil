import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Botao } from '../../components/atoms/Botao/Botao';
import { EntradaTexto } from '../../components/atoms/EntradaTexto/EntradaTexto';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { useSeguranca } from '../../hooks/useSeguranca';

export const ResetarSenha: React.FC = () => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [sucesso, setSucesso] = useState(false);
  
  const { resetarSenha, isResetando } = useSeguranca();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') || '';

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    
    try {
      await resetarSenha({ token, novaSenha });
      setSucesso(true);
    } catch (err) {
      alert("Token inválido ou expirado. Solicite uma nova recuperação.");
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <p className="glass-card p-6 border-red-500/20 text-red-200">
          Token de recuperação ausente. Por favor, use o link enviado por e-mail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 xs:p-2 bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-sm p-8 xs:p-6 text-center z-10"
      >
        {!sucesso ? (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 mb-6 border border-white/5">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
            </div>
            
            <h1 className="font-display font-bold text-2xl mb-2 text-white">
              Nova Senha
            </h1>
            
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Defina uma senha forte e segura para sua conta.
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-5">
              <EntradaTexto
                label="Nova Senha"
                type="password"
                placeholder="••••••••"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
              <EntradaTexto
                label="Confirmar Nova Senha"
                type="password"
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />

              <Botao type="submit" loading={isResetando}>
                Atualizar Senha
              </Botao>
            </form>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 mb-6 border border-emerald-500/20">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            
            <h1 className="font-display font-bold text-2xl mb-2 text-white">
              Sucesso!
            </h1>
            
            <p className="text-slate-300 text-sm mb-6">
              Sua senha foi atualizada. Você já pode acessar sua conta.
            </p>

            <Botao className="mt-6" onClick={() => window.location.href = "/login"}>
              Ir para Login
            </Botao>
          </>
        )}
      </motion.div>
    </div>
  );
};
