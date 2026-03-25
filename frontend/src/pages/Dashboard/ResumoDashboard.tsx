import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardGrid } from '../../components/organisms/DashboardGrid/DashboardGrid';
import { Rocket, Users, BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle, FileText, Briefcase } from 'lucide-react';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { useLeads } from '../../hooks/useLeads';

type ModuloFiltro = 'TODOS' | 'CRM' | 'ONBOARDING' | 'ROTINAS' | 'CONTRATOS' | 'ALVARAS' | 'PROCESSOS';

export const ResumoDashboard: React.FC = () => {
  const [moduloFiltro, setModuloFiltro] = useState<ModuloFiltro>('TODOS');
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const { leads, isLoading } = useLeads();

  const totalLeads = leads?.length ?? 0;
  const convertidos = leads?.filter(l => l.status === 'CONVERTIDO').length ?? 0;
  const qualificados = leads?.filter(l => l.status === 'QUALIFICADO').length ?? 0;
  const emOnboarding = leads?.filter(l => l.status === 'QUALIFICADO' || l.status === 'NEGOCIACAO').length ?? 0;
  const taxaConversao = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0;

  const filtros: { valor: ModuloFiltro; label: string }[] = [
    { valor: 'TODOS', label: 'Visão Geral' },
    { valor: 'CRM', label: 'CRM' },
    { valor: 'ONBOARDING', label: 'Onboarding' },
    { valor: 'ROTINAS', label: 'Rotinas' },
    { valor: 'ALVARAS', label: 'Alvarás' },
    { valor: 'PROCESSOS', label: 'Processos' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex-col gap-8 flex pb-10"
    >
      {/* Filtro de Módulo BI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Texto variant="titulo" className="flex items-center gap-2 whitespace-nowrap">
          <BarChart3 className="text-blue-600 dark:text-blue-500" size={24} />
          Dashboard
        </Texto>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
          <input
            type="month"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-text-main flex-shrink-0"
          />
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 overflow-x-auto flex-nowrap no-scrollbar max-w-full">
            {filtros.map(f => (
              <button
                key={f.valor}
                onClick={() => setModuloFiltro(f.valor)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex-shrink-0 whitespace-nowrap ${
                  moduloFiltro === f.valor
                    ? 'bg-white dark:bg-slate-800 text-text-main shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas Dinâmicas por Módulo */}
      {moduloFiltro === 'CRM' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><Users size={18} /></div>
                <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : totalLeads}</Texto>
              </div>
              <Texto variant="label">Total de Leads</Texto>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={18} /></div>
                <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : convertidos}</Texto>
              </div>
              <Texto variant="label">Convertidos</Texto>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><TrendingUp size={18} /></div>
                <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : `${taxaConversao}%`}</Texto>
              </div>
              <Texto variant="label">Taxa de Conversão</Texto>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Users size={18} /></div>
                <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : qualificados}</Texto>
              </div>
              <Texto variant="label">Qualificados</Texto>
            </Card>
          </div>

          <Card className="p-6">
            <Texto variant="subtitulo" className="mb-6">Engajamento de Leads (Mensal)</Texto>
            <div className="h-[200px] w-full flex items-end gap-2 px-2">
              {[40, 65, 45, 90, 55, 80, 70, 85, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 rounded-t-md transition-all duration-500 relative"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}%
                    </div>
                  </div>
                  <div className="text-[10px] text-text-secondary">{i + 1}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <Texto variant="detalhe">Volume de Propostas</Texto>
              </div>
            </div>
          </Card>
        </div>
      )}

      {moduloFiltro === 'ONBOARDING' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Rocket size={18} /></div>
              <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : emOnboarding}</Texto>
            </div>
            <Texto variant="label">Em Implantação</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={18} /></div>
              <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : convertidos}</Texto>
            </div>
            <Texto variant="label">Onboarding Concluído</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><Clock size={18} /></div>
              <Texto variant="titulo" className="text-2xl">{isLoading ? '—' : Math.max(0, emOnboarding - convertidos)}</Texto>
            </div>
            <Texto variant="label">Aguardando Doc.</Texto>
          </Card>
        </div>
      )}

      {moduloFiltro === 'ROTINAS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><AlertCircle size={18} /></div>
              <Texto variant="titulo" className="text-2xl">12</Texto>
            </div>
            <Texto variant="label">Guias Pendentes</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><Clock size={18} /></div>
              <Texto variant="titulo" className="text-2xl">08</Texto>
            </div>
            <Texto variant="label">Aguardando Cliente</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 size={18} /></div>
              <Texto variant="titulo" className="text-2xl">45</Texto>
            </div>
            <Texto variant="label">Concluídas</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600"><AlertCircle size={18} /></div>
              <Texto variant="titulo" className="text-2xl">02</Texto>
            </div>
            <Texto variant="label">Vencidas</Texto>
          </Card>
        </div>
      )}

      {moduloFiltro === 'ALVARAS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><FileText size={18} /></div>
              <Texto variant="titulo" className="text-2xl">24</Texto>
            </div>
            <Texto variant="label">Total de Licenças</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Clock size={18} /></div>
              <Texto variant="titulo" className="text-2xl">05</Texto>
            </div>
            <Texto variant="label">Próximos Vencimentos</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600"><AlertCircle size={18} /></div>
              <Texto variant="titulo" className="text-2xl">01</Texto>
            </div>
            <Texto variant="label">Irregular</Texto>
          </Card>
        </div>
      )}

      {moduloFiltro === 'PROCESSOS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600"><Briefcase size={18} /></div>
              <Texto variant="titulo" className="text-2xl">10</Texto>
            </div>
            <Texto variant="label">Em Andamento</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 size={18} /></div>
              <Texto variant="titulo" className="text-2xl">32</Texto>
            </div>
            <Texto variant="label">Finalizados (Mês)</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><TrendingUp size={18} /></div>
              <Texto variant="titulo" className="text-2xl">R$ 4.5k</Texto>
            </div>
            <Texto variant="label">Honorários Processos</Texto>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Clock size={18} /></div>
              <Texto variant="titulo" className="text-2xl">03</Texto>
            </div>
            <Texto variant="label">Aguardando Órgão</Texto>
          </Card>
        </div>
      )}

      {/* Cards de Métricas (Visão Geral padrão) */}
      {moduloFiltro === 'TODOS' && <DashboardGrid />}


    </motion.div>
  );
};
