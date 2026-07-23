import React from 'react';
import type { ReactNode } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';
import { Skeleton } from '../../atoms/Skeleton/Skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CardMetricaProps {
  titulo: string;
  valor: string | number;
  icone: ReactNode;
  corDestaque?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'purple' | 'rose';
  loading?: boolean;
  variacaoPercentual?: number;
  legendaVariacao?: string;
}

export const CardMetrica: React.FC<CardMetricaProps> = ({ 
  titulo, 
  valor, 
  icone, 
  corDestaque = 'blue', 
  loading = false,
  variacaoPercentual,
  legendaVariacao = 'vs mês anterior'
}) => {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-500 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-600 dark:text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-600 dark:text-purple-500 bg-purple-500/10 border-purple-500/20',
    rose: 'text-rose-600 dark:text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  const currentColors = colorMap[corDestaque];
  const isPositivo = variacaoPercentual !== undefined && variacaoPercentual >= 0;

  return (
    <Card 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 xs:p-4 flex flex-col gap-3"
    >
      <div className="flex justify-between items-center">
        <Texto variant="label" className="xs:text-[10px]">
          {titulo}
        </Texto>
        <div className={`p-2 rounded-xl border ${currentColors} transition-colors`}>
          {icone}
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <Texto variant="titulo" className="text-2xl xs:text-xl">
            {valor}
          </Texto>
        )}

        {variacaoPercentual !== undefined && !loading && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositivo 
              ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' 
              : 'text-rose-600 bg-rose-500/10 dark:text-rose-400'
          }`}>
            {isPositivo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositivo ? `+${variacaoPercentual}%` : `${variacaoPercentual}%`}</span>
          </div>
        )}
      </div>

      {legendaVariacao && variacaoPercentual !== undefined && !loading && (
        <span className="text-[10px] text-text-secondary">{legendaVariacao}</span>
      )}
    </Card>
  );
};
