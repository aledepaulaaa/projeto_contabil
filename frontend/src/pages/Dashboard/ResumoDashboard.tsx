import React from 'react';
import { motion } from 'framer-motion';
import { DashboardGrid } from '../../components/organisms/DashboardGrid/DashboardGrid';
import { ListaLeads } from '../../components/organisms/ListaLeads/ListaLeads';
import { CalendarioFiscal } from '../../components/organisms/CalendarioFiscal/CalendarioFiscal';
import { useLocation } from 'wouter';
import { AreaRelatorios } from '../../components/organisms/AreaRelatorios/AreaRelatorios';
import { Rocket, Users, Calendar, FileCheck, ArrowRight } from 'lucide-react';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

export const ResumoDashboard: React.FC = () => {
  const [, setLocation] = useLocation();

  const atalhos = [
    { label: 'CRM / Leads', icon: Users, path: '/dashboard/crm', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Onboarding', icon: Rocket, path: '/dashboard/onboarding', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Rotinas', icon: Calendar, path: '/dashboard/rotinas', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Alvarás', icon: FileCheck, path: '/dashboard/alvaras', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex-col gap-8 flex pb-10"
    >
      {/* Cards de Métricas */}
      <DashboardGrid />
      
      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {atalhos.map((atalho) => (
          <Card
            key={atalho.path}
            as="button"
            onClick={() => setLocation(atalho.path)}
            className="flex items-center justify-between p-5 hover:border-slate-400 dark:hover:border-slate-700 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${atalho.bg} ${atalho.color} transition-colors`}>
                <atalho.icon size={24} />
              </div>
              <Texto variant="corpo" className="font-bold text-sm tracking-tight">{atalho.label}</Texto>
            </div>
            <ArrowRight size={18} className="text-text-secondary group-hover:text-text-main transition-colors" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CalendarioFiscal />
        <AreaRelatorios />
      </div>

      <ListaLeads />
    </motion.div>
  );
};
