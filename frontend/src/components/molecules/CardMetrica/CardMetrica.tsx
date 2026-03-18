import React from 'react';
import type { ReactNode } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';
import { Skeleton } from '../../atoms/Skeleton/Skeleton';

interface CardMetricaProps {
  titulo: string;
  valor: string | number;
  icone: ReactNode;
  corDestaque?: 'blue' | 'emerald' | 'amber';
  loading?: boolean;
}

export const CardMetrica: React.FC<CardMetricaProps> = ({ 
  titulo, 
  valor, 
  icone, 
  corDestaque = 'blue', 
  loading = false 
}) => {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  const currentColors = colorMap[corDestaque];

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

      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <Texto variant="titulo" className="text-2xl xs:text-xl">
            {valor}
          </Texto>
        )}
      </div>
    </Card>
  );
};
