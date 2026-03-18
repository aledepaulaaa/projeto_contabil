import React from 'react';
import { CardMetrica } from '../../molecules/CardMetrica/CardMetrica';
import { useDashboard } from '../../../hooks/useDashboard';
import { Users, FileStack, AlertCircle, DollarSign } from 'lucide-react';
import { useResolucao } from '../../../contexts/ResolucaoContext';

export const DashboardGrid: React.FC = () => {
  const { metrics, isLoading } = useDashboard();
  const { isMobile } = useResolucao();

  return (
    <div className={`grid gap-6 xs:gap-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
      <CardMetrica
        titulo="Total de Leads"
        valor={metrics?.totalLeads || 0}
        loading={isLoading}
        icone={<Users className="w-5 h-5 text-blue-500" />}
        corDestaque="blue"
      />

      <CardMetrica
        titulo="Obrigações Pend."
        valor={metrics?.obrigacoesPendentes || 0}
        loading={isLoading}
        icone={<AlertCircle className="w-5 h-5 text-amber-500" />}
        corDestaque="amber"
      />

      <CardMetrica
        titulo="Alvarás Vencidos"
        valor={metrics?.alvarasVencidos || 0}
        loading={isLoading}
        icone={<FileStack className="w-5 h-5 text-emerald-500" />}
        corDestaque="emerald"
      />

      <CardMetrica
        titulo="Faturamento"
        valor={
          metrics?.faturamentoPrevisto
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.faturamentoPrevisto)
            : 'R$ 0,00'
        }
        loading={isLoading}
        icone={<DollarSign className="w-5 h-5 text-emerald-500" />}
        corDestaque="emerald"
      />
    </div>
  );
};
