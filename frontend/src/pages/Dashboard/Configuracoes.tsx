import React from 'react';
import { Settings, Bell, Globe, Shield, Wallet } from 'lucide-react';

export const Configuracoes: React.FC = () => {
  const sections = [
    { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Gerencie alertas via E-mail e WhatsApp' },
    { id: 'regional', label: 'Regional & Idioma', icon: Globe, desc: 'Fuso horário e formatos de data' },
    { id: 'privacidade', label: 'Privacidade', icon: Shield, desc: 'Controle de visibilidade e auditoria' },
    { id: 'faturamento', label: 'Faturamento', icon: Wallet, desc: 'Histórico de pagamentos e faturas' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
          <Settings className="text-blue-500" size={28} />
          Configurações Gerais
        </h2>
        <p className="text-slate-400 text-sm mt-1">Personalize o comportamento do sistema para sua empresa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/40 transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-800 rounded-xl text-slate-400 group-hover:text-blue-400 transition-colors">
                <section.icon size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold">{section.label}</h3>
                <p className="text-xs text-slate-500">{section.desc}</p>
              </div>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-blue-600/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
