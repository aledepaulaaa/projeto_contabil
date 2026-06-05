import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock, MapPin, ExternalLink } from 'lucide-react';
import { useObrigacoes } from '../../../hooks/useObrigacoes';
import type { Obrigacao } from '../../../hooks/useObrigacoes';
import { useResolucao } from '../../../contexts/ResolucaoContext';
import { Skeleton } from '../../atoms/Skeleton/Skeleton';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';

export const CalendarioFiscal: React.FC = () => {
  const { obrigacoes, isLoading, error, refreshObrigacoes } = useObrigacoes();
  const { isMobile } = useResolucao();
  const isXS = isMobile;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'text-amber-600 dark:text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'ATRASADO': return 'text-rose-600 dark:text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'PAGO': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-500 dark:text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE': return <Clock className="w-4 h-4" />;
      case 'ATRASADO': return <AlertCircle className="w-4 h-4" />;
      case 'PAGO': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-8 w-full">
        <Texto variant="subtitulo" className="flex items-center gap-2">
          Calendário Fiscal <Skeleton className="w-5 h-5 rounded-full" />
        </Texto>
        <Card className="min-h-[300px] flex flex-col gap-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-7 gap-2">
             {[...Array(28)].map((_, i) => (
               <Skeleton key={i} className="h-12 w-full rounded-lg" />
             ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 mt-8 w-full">
        <Texto variant="subtitulo" className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Agenda Tributária
        </Texto>
        <Card className="min-h-[200px] flex flex-col items-center justify-center gap-4 text-center border-rose-500/20 bg-rose-500/5">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div>
            <Texto variant="corpo" className="font-medium">Serviço Temporariamente Indisponível</Texto>
            <Texto variant="detalhe" className="mt-1">Houve um erro ao buscar as obrigações fiscais. Nossos serviços podem estar em atualização.</Texto>
          </div>
          <button 
            onClick={() => refreshObrigacoes()} 
            className="mt-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm transition-colors hover:bg-slate-200 dark:hover:bg-white/10 text-text-main"
          >
            Tentar Novamente
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-8 w-full">
      <div className="flex justify-between items-center">
        <Texto variant="subtitulo" className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Agenda Tributária
        </Texto>
        <Texto variant="detalhe" className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
          Este Mês
        </Texto>
      </div>

      <AnimatePresence mode="wait">
        {isXS ? (
          <motion.div 
            key="xs-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-3"
          >
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 transition-colors">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
              <Texto variant="detalhe" className="text-amber-700 dark:text-amber-200">Exibindo apenas alertas críticos para telas ultra-pequenas.</Texto>
            </div>
            
            {obrigacoes?.map((item: Obrigacao) => (
              <Card key={item.id} className="p-4 flex flex-col gap-3 border-l-4 border-l-blue-500/50">
                <div className="flex justify-between items-start">
                  <Texto variant="corpo" className="font-semibold">{item.tipo}</Texto>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <Texto variant="detalhe" className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Vence em: {item.vencimento.split('-').reverse().join('/')}
                  </Texto>
                  <Texto variant="detalhe" className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Comp: {item.competencia}
                  </Texto>
                </div>
                <Texto variant="titulo" className="text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                </Texto>
              </Card>
            ))}
          </motion.div>
        ) : (
          <Card 
            as={motion.div}
            key="calendar-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            noPadding
            className="p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {obrigacoes?.map((item: Obrigacao) => (
                <Card 
                  key={item.id} 
                  variant="flat"
                  className="group relative p-5 hover:border-blue-500/30 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 transition-colors">
                      <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </div>
                  </div>

                  <Texto variant="subtitulo" className="mb-1">{item.tipo}</Texto>
                  <Texto variant="detalhe" className="mb-4">{item.regime} • Ref: {item.competencia}</Texto>

                  <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                      <Texto variant="label" className="text-[10px]">Valor da Guia</Texto>
                      <Texto variant="titulo" className="text-xl">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                      </Texto>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <Texto variant="label" className="text-[10px]">Vencimento</Texto>
                      <Texto variant="corpo" className="text-sm font-medium">
                         {item.vencimento.split('-').reverse().join('/')}
                      </Texto>
                    </div>
                  </div>

                  <button className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                    <ExternalLink className="w-4 h-4" />
                    Gerar PDF da Guia
                  </button>
                </Card>
              ))}
            </div>
            
            {(!obrigacoes || obrigacoes.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <CalendarIcon className="w-12 h-12 mb-4 text-text-secondary" />
                <Texto variant="corpo" className="text-lg font-medium">Nenhuma obrigação para este período</Texto>
                <Texto variant="detalhe" className="text-sm">Tudo em dia com o fisco!</Texto>
              </div>
            )}
          </Card>
        )}
      </AnimatePresence>
    </div>
  );
};
