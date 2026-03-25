import React from 'react';
import { CardMetrica } from '../../molecules/CardMetrica/CardMetrica';
import { useDashboard } from '../../../hooks/useDashboard';
import { Users, FileStack, Rocket, Calendar } from 'lucide-react';
import { useResolucao } from '../../../contexts/ResolucaoContext';
import { useLocation } from 'wouter';

export const DashboardGrid: React.FC = () => {
  const { metrics, isLoading } = useDashboard();
  const { isMobile } = useResolucao();
  const [, setLocation] = useLocation();

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
    <div className={`grid gap-6 xs:gap-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
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
  );
};
