import React from 'react';
import { CardMetrica } from '../../molecules/CardMetrica/CardMetrica';
import { useDashboard } from '../../../hooks/useDashboard';
import { Users, FileStack, Rocket, Calendar, DollarSign, Target, UserX, FileCheck } from 'lucide-react';
import { useResolucao } from '../../../contexts/ResolucaoContext';
import { useLocation } from 'wouter';

export const DashboardGrid: React.FC = () => {
  const { metrics, isLoading } = useDashboard();
  const { isMobile } = useResolucao();
  const [, setLocation] = useLocation();

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const mainMetrics = [
    {
      titulo: "LTV (Lifetime Value)",
      valor: formatCurrency(metrics?.ltv ?? 0),
      icone: <DollarSign className="w-5 h-5 text-emerald-500" />,
      cor: "emerald" as const,
      variacaoPercentual: metrics?.variacaoReceitaPercentual,
    },
    {
      titulo: "CAC (Custo de Aquisição)",
      valor: formatCurrency(metrics?.cac ?? 0),
      icone: <Target className="w-5 h-5 text-indigo-500" />,
      cor: "indigo" as const,
      variacaoPercentual: undefined,
    },
    {
      titulo: "Taxa de Churn",
      valor: `${metrics?.churnRate ?? 0}%`,
      icone: <UserX className="w-5 h-5 text-rose-500" />,
      cor: "rose" as const,
      variacaoPercentual: undefined,
    },
    {
      titulo: "Contratos Ativos",
      valor: metrics?.contratosAtivos ?? 0,
      icone: <FileCheck className="w-5 h-5 text-blue-500" />,
      cor: "blue" as const,
      variacaoPercentual: metrics?.variacaoReceitaPercentual,
    },
  ];

  const shortcuts = [
    {
      titulo: "CRM / Leads",
      valor: metrics?.totalLeads || 0,
      icone: <Users className="w-5 h-5 text-blue-500" />,
      cor: "blue" as const,
      path: "/dashboard/crm"
    },
    {
      titulo: "Onboarding",
      valor: "Ativo",
      icone: <Rocket className="w-5 h-5 text-indigo-500" />,
      cor: "indigo" as const,
      path: "/dashboard/onboarding"
    },
    {
      titulo: "Rotinas",
      valor: metrics?.obrigacoesPendentes || 0,
      icone: <Calendar className="w-5 h-5 text-amber-500" />,
      cor: "amber" as const,
      path: "/dashboard/rotinas"
    },
    {
      titulo: "Alvarás",
      valor: metrics?.alvarasVencidos || 0,
      icone: <FileStack className="w-5 h-5 text-emerald-500" />,
      cor: "emerald" as const,
      path: "/dashboard/alvaras"
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Bloco de Métricas Financeiras & Saúde (LTV, CAC, Churn, Contratos) */}
      <div className={`grid gap-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {mainMetrics.map((m, i) => (
          <CardMetrica
            key={i}
            titulo={m.titulo}
            valor={m.valor}
            loading={isLoading}
            icone={m.icone}
            corDestaque={m.cor}
            variacaoPercentual={m.variacaoPercentual}
          />
        ))}
      </div>

      {/* Atalhos Operacionais dos Módulos */}
      <div className={`grid gap-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {shortcuts.map((s, i) => (
          <div key={i} onClick={() => setLocation(s.path)} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <CardMetrica
              titulo={s.titulo}
              valor={s.valor}
              loading={isLoading}
              icone={s.icone}
              corDestaque={s.cor}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
