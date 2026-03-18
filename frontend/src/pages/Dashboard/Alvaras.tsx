import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

interface Alvara {
  id: string;
  empresa: string;
  tipo: 'Funcionamento' | 'Sanitário' | 'Bombeiros' | 'Ambiental';
  vencimento: string;
  status: 'VIGENTE' | 'VENCIDO' | 'EM_RENOVACAO';
  controlaAlvara: boolean;
}

const alvarasIniciais: Alvara[] = [
  { id: '1', empresa: 'Padaria Modelo', tipo: 'Funcionamento', vencimento: '2024-05-15', status: 'VIGENTE', controlaAlvara: true },
  { id: '2', empresa: 'Lanchonete Express', tipo: 'Sanitário', vencimento: '2024-03-10', status: 'VENCIDO', controlaAlvara: true },
  { id: '3', empresa: 'Tech Hub', tipo: 'Bombeiros', vencimento: '2024-08-22', status: 'VIGENTE', controlaAlvara: true },
  { id: '4', empresa: 'Auto Peças Silva', tipo: 'Ambiental', vencimento: '2024-04-01', status: 'EM_RENOVACAO', controlaAlvara: true },
];

export const Alvaras: React.FC = () => {
  const [alvaras] = useState<Alvara[]>(alvarasIniciais);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
      case 'VENCIDO': return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
      case 'EM_RENOVACAO': return 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Texto variant="titulo" className="flex items-center gap-3">
            <FileText className="text-blue-600 dark:text-blue-500" size={28} />
            Alvarás & Licenças
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Monitoramento de prazos e conformidade legal das empresas</Texto>
        </div>
        <div className="flex gap-3">
          <Botao variant="outline" className="md:w-auto px-4 flex items-center gap-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-transparent text-text-main shadow-sm dark:shadow-none">
            <Filter size={18} />
            Configurações
          </Botao>
          <Botao className="md:w-auto px-6 flex items-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={20} />
            Novo Registro
          </Botao>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 transition-colors">
        {[
          { label: 'Total Ativos', value: alvaras.length, icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-500', bgColor: 'bg-blue-100 dark:bg-slate-800' },
          { label: 'Vencidos', value: alvaras.filter((a: Alvara) => a.status === 'VENCIDO').length, icon: AlertTriangle, color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-100 dark:bg-slate-800' },
          { label: 'Em Renovação', value: alvaras.filter((a: Alvara) => a.status === 'EM_RENOVACAO').length, icon: Clock, color: 'text-amber-600 dark:text-amber-500', bgColor: 'bg-amber-100 dark:bg-slate-800' },
          { label: 'A Vencer (30d)', value: 2, icon: Clock, color: 'text-indigo-600 dark:text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-slate-800' },
        ].map((stat, i) => (
          <Card key={i} className="flex items-center gap-4 py-4 px-4">
            <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color} transition-colors`}>
              <stat.icon size={20} />
            </div>
            <div>
              <Texto variant="label" className="text-[10px]">{stat.label}</Texto>
              <Texto variant="titulo" className="text-xl">{stat.value}</Texto>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros e Tabela */}
      <Card noPadding>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar por empresa ou alvará..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 text-text-main placeholder:text-text-secondary transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 transition-colors">
            {['TODOS', 'VIGENTE', 'VENCIDO', 'EM_RENOVACAO'].map(status => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all uppercase tracking-tight
                  ${filtroStatus === status 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-800 text-text-secondary hover:text-blue-600 dark:hover:text-white border border-slate-100 dark:border-slate-700/50'}
                `}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <th className="px-6 py-4"><Texto variant="label">Empresa</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Tipo de Alvará</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Vencimento</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Status</Texto></th>
                <th className="px-6 py-4 text-right"><Texto variant="label">Ação</Texto></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
              {alvaras
                .filter((a: Alvara) => filtroStatus === 'TODOS' || a.status === filtroStatus)
                .map((alvara: Alvara) => (
                <tr key={alvara.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-secondary transition-colors">
                        <Building size={16} />
                      </div>
                      <Texto variant="corpo" className="font-semibold">{alvara.empresa}</Texto>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Texto variant="corpo" className="text-sm">{alvara.tipo}</Texto></td>
                  <td className="px-6 py-4">
                    <Texto variant="detalhe" className="text-sm font-mono">
                      {new Date(alvara.vencimento).toLocaleDateString()}
                    </Texto>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${getStatusBadge(alvara.status)}`}>
                      {alvara.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-600/5 dark:bg-blue-500/5 px-2 py-1 rounded border border-blue-600/20 dark:border-blue-500/20"
                    >
                      ABRIR PROCESSO
                      <ArrowUpRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
