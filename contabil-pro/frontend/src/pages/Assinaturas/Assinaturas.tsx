import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Shield, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Botao } from '../../components/atoms/Botao/Botao';

const CardPlano: React.FC<{
  titulo: string;
  preco: string;
  recursos: string[];
  popular?: boolean;
  icon: React.ElementType;
}> = ({ titulo, preco, recursos, popular, icon: Icon }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`
      flex flex-col p-8 rounded-3xl bg-white dark:bg-slate-900/40 backdrop-blur-xl border transition-all shadow-sm dark:shadow-none
      ${popular ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}
    `}
  >
    {popular && (
      <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">
        Recomendado
      </span>
    )}
    
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-2xl ${popular ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white transition-colors">{titulo}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors">Gestão completa e automatizada</p>
      </div>
    </div>

    <div className="mb-8">
      <span className="text-4xl font-display font-bold text-slate-900 dark:text-white transition-colors">{preco}</span>
      <span className="text-slate-500 dark:text-slate-400 text-sm ml-2 transition-colors">/mês</span>
    </div>

    <ul className="flex-1 space-y-4 mb-8">
      {recursos.map((rec, i) => (
        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 transition-colors">
          <Check size={16} className="text-emerald-500 shrink-0" />
          {rec}
        </li>
      ))}
    </ul>

    <Botao 
      variant={popular ? 'primary' : 'outline'}
      className={!popular ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300' : ''}
    >
      Selecionar Plano
    </Botao>
  </motion.div>
);

export const Assinaturas: React.FC = () => {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 xs:p-4 transition-colors">
      <div className="max-w-6xl mx-auto py-12">
        <button
          onClick={() => setLocation('/dashboard')}
          className="mb-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors group relative z-20"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Voltar para o Dashboard</span>
        </button>

        <header className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4 transition-colors"
          >
            Escolha o Plano Ideal para seu Escritório
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto transition-colors"
          >
            Sua licença de testes expirou. Para continuar aproveitando todas as automações e o motor de rotinas inteligente, selecione uma das opções abaixo.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <CardPlano 
            titulo="Essencial"
            preco="R$ 199"
            icon={Zap}
            recursos={[
              'Até 10 clientes',
              'Gestão de Leads (CRM)',
              'Calendário Fiscal Básico',
              'Suporte via E-mail'
            ]}
          />
          <CardPlano 
            titulo="Profissional"
            preco="R$ 499"
            popular
            icon={Crown}
            recursos={[
              'Clientes Ilimitados',
              'Motor de Rotinas (Automático)',
              'Homologação de PDFs',
              'Integração WhatsApp Web',
              'Gestão de Alvarás e Prazos',
              'Suporte Prioritário'
            ]}
          />
          <CardPlano 
            titulo="Enterprise"
            preco="Sob Consulta"
            icon={Shield}
            recursos={[
              'Tudo do Profissional',
              'API Customizada',
              'Consultoria de Setup',
              'SLA Garantido',
              'Gerente de Conta Dedicado'
            ]}
          />
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-center max-w-3xl mx-auto shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors">Precisa de algo personalizado?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 transition-colors">Fale com nosso time de especialistas para adaptarmos a plataforma à sua estrutura de processos e volumes.</p>
          <Botao variant="outline" className="w-fit mx-auto border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Falar com Consultor</Botao>
        </div>
      </div>
    </div>
  );
};
