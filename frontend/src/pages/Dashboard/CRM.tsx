import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  FileCheck, 
  Handshake,
  Plus,
  MoreVertical,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

interface Lead {
  id: string;
  nome: string;
  contato: string;
  etapa: 'LEAD' | 'QUALIFICAÇAO' | 'PROPOSTA' | 'FECHAMENTO';
  valor?: number;
  data: string;
}

const leadsIniciais: Lead[] = [
  { id: '1', nome: 'Empresa Alpha Ltda', contato: '(11) 98888-7777', etapa: 'LEAD', data: '2024-03-15' },
  { id: '2', nome: 'Boutique do Café', contato: '(21) 97777-6666', etapa: 'QUALIFICAÇAO', data: '2024-03-14' },
  { id: '3', nome: 'Tech Soluções', contato: 'contato@tech.com', etapa: 'PROPOSTA', valor: 1500, data: '2024-03-10' },
  { id: '4', nome: 'Padaria Central', contato: '(11) 96666-5555', etapa: 'FECHAMENTO', valor: 800, data: '2024-03-08' },
];

export const CRM: React.FC = () => {
  const [leads] = useState<Lead[]>(leadsIniciais);

  const etapas = [
    { id: 'LEAD', label: 'Lead', icon: Users, color: 'text-slate-500' },
    { id: 'QUALIFICAÇAO', label: 'Qualificação', icon: Target, color: 'text-orange-500' },
    { id: 'PROPOSTA', label: 'Proposta', icon: FileCheck, color: 'text-blue-500' },
    { id: 'FECHAMENTO', label: 'Fechamento', icon: Handshake, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Texto variant="titulo" className="flex items-center gap-3">
            <Users className="text-blue-600 dark:text-blue-500" size={28} />
            Gestão de Leads & CRM
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Acompanhe o funil de vendas e conversão de novos clientes</Texto>
        </div>
        <Botao className="flex items-center gap-2">
          <Plus size={20} />
          Novo Lead
        </Botao>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-colors">
        {etapas.map((etapa) => (
          <Card key={etapa.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${etapa.color} transition-colors`}>
                <etapa.icon size={20} />
              </div>
              <Texto variant="titulo" className="text-2xl">
                {leads.filter(l => l.etapa === etapa.id).length}
              </Texto>
            </div>
            <Texto variant="label">{etapa.label}</Texto>
          </Card>
        ))}
      </div>

      {/* Kanban / Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {etapas.map((etapa) => (
          <div key={etapa.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <Texto variant="label" className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${etapa.color.replace('text', 'bg')} transition-all`} />
                {etapa.label}
              </Texto>
              <Texto variant="detalhe" className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 transition-colors">
                {leads.filter(l => l.etapa === etapa.id).length}
              </Texto>
            </div>

            <div className="flex flex-col gap-3 min-h-[200px]">
              {leads
                .filter((l) => l.etapa === etapa.id)
                .map((lead) => (
                  <Card
                    as={motion.div}
                    layoutId={lead.id}
                    key={lead.id}
                    className="p-4 hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Texto variant="corpo" className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {lead.nome}
                      </Texto>
                      <button className="text-text-secondary hover:text-text-main transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      <Texto variant="detalhe" className="flex items-center gap-2">
                        <Phone size={12} />
                        {lead.contato}
                      </Texto>
                    </div>

                    {lead.valor && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between transition-colors">
                        <Texto variant="label" className="text-[10px]">Valor Estimado</Texto>
                        <Texto variant="corpo" className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor)}
                        </Texto>
                      </div>
                    )}
                    
                    <button className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-text-secondary hover:text-text-main bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      Mover Etapa
                      <ArrowRight size={12} />
                    </button>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
