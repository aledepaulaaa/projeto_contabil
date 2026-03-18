import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Botao } from '../../components/atoms/Botao/Botao';
import { EntradaTexto } from '../../components/atoms/EntradaTexto/EntradaTexto';
import { LinkTexto } from '../../components/atoms/LinkTexto/LinkTexto';
import { KeyRound, ArrowLeft, MailCheck } from 'lucide-react';
import { useSeguranca } from '../../hooks/useSeguranca';

export const RecuperarSenha: React.FC = () => {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const { recuperarSenha, isRecuperando } = useSeguranca();

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recuperarSenha(email);
      setEnviado(true);
    } catch (err) {
      console.error("Erro ao solicitar recuperação:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 xs:p-2 bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-sm p-8 xs:p-6 text-center z-10"
      >
        {!enviado ? (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-6 border border-white/5">
              <KeyRound className="w-7 h-7 text-blue-400" />
            </div>
            
            <h1 className="font-display font-bold text-2xl mb-2 text-white">
              Recuperar Senha
            </h1>
            
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Informe seu e-mail cadastrado. Enviaremos as instruções para definir uma nova senha.
            </p>

            <form onSubmit={handleRecuperar} className="flex flex-col gap-5">
              <EntradaTexto
                id="email"
                label="Seu E-mail"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Botao type="submit" loading={isRecuperando}>
                Enviar Instruções
              </Botao>
            </form>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 mb-6 border border-emerald-500/20">
              <MailCheck className="w-7 h-7 text-emerald-400" />
            </div>
            
            <h1 className="font-display font-bold text-2xl mb-2 text-white">
              E-mail Enviado!
            </h1>
            
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Verifique sua caixa de entrada (e spam). Se o e-mail existir no nosso sistema, você receberá o link de reset.
            </p>

            <Botao onClick={() => window.location.href = "/login"}>
              Voltar ao Login
            </Botao>
          </>
        )}

        <div className="mt-6">
          <LinkTexto href="/login" className="flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            Voltar para Login
          </LinkTexto>
        </div>
      </motion.div>
    </div>
  );
};
