import React, { useState } from 'react';
import { Key, ShieldCheck, Eye, EyeOff, Save } from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';

export const AlterarSenha: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3 transition-colors">
          <Key className="text-blue-600 dark:text-blue-500" size={28} />
          Segurança
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Altere sua senha de acesso periodicamente para sua segurança</p>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl backdrop-blur-xl space-y-6 shadow-sm dark:shadow-none transition-colors">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha Atual</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-4 pr-12 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-400"
                placeholder="Sua senha atual"
              />
              <button 
                onClick={() => setShowCurrent(!showCurrent)}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nova Senha</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-4 pr-12 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-400"
                placeholder="Mínimo 8 caracteres"
              />
              <button 
                onClick={() => setShowNew(!showNew)}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar Nova Senha</label>
            <input 
              type="password"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-400"
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-600/5 border border-blue-100 dark:border-blue-500/10 p-4 rounded-xl flex gap-3 items-start transition-colors">
          <ShieldCheck className="text-blue-600 dark:text-blue-500 mt-1" size={20} />
          <div>
            <h4 className="text-slate-900 dark:text-white text-sm font-bold transition-colors">Requisitos de Senha</h4>
            <ul className="text-xs text-slate-600 dark:text-slate-500 list-disc list-inside mt-1 space-y-1 transition-colors">
              <li>Mínimo de 8 caracteres</li>
              <li>Pelo menos um caractere especial</li>
              <li>Pelo menos um número</li>
            </ul>
          </div>
        </div>

        <div className="pt-4">
          <Botao 
            loading={loading}
            className="flex items-center gap-2 shadow-lg shadow-blue-600/20"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
          >
            <Save size={20} />
            Atualizar Senha
          </Botao>
        </div>
      </div>
    </div>
  );
};
