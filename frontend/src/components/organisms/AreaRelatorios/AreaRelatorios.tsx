import React, { useState } from 'react';
import { BotaoExportar } from '../../atoms/BotaoExportar/BotaoExportar';
import { useRelatorios } from '../../../hooks/useRelatorios';
import { FileChartPie } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';

export const AreaRelatorios: React.FC = () => {
  const { exportarRelatorioMensal } = useRelatorios();
  
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const handleExportar = () => {
    exportarRelatorioMensal.mutate({ mes, ano });
  };

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const anos = [2024, 2025, 2026];

  return (
    <Card className="shadow-2xl h-full flex flex-col justify-between transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors">
          <FileChartPie className="w-6 h-6" />
        </div>
        <div>
          <Texto variant="subtitulo">Relatórios Mensais</Texto>
          <Texto variant="detalhe">Exporte faturamento e impostos consolidados</Texto>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 mt-auto">
        <div className="flex-1 min-w-[150px]">
          <Texto variant="label" className="mb-2">Mês de Referência</Texto>
          <select 
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-text-main outline-none focus:border-blue-500/50 transition-colors"
          >
            {meses.map((m, idx) => (
              <option key={m} value={idx + 1} className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white">{m}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <Texto variant="label" className="mb-2">Ano</Texto>
          <select 
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-text-main outline-none focus:border-blue-500/50 transition-colors"
          >
            {anos.map(a => (
              <option key={a} value={a} className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white">{a}</option>
            ))}
          </select>
        </div>

        <BotaoExportar 
          onClick={handleExportar} 
          isLoading={exportarRelatorioMensal.isPending}
        />
      </div>

      {exportarRelatorioMensal.isError && (
        <Texto variant="detalhe" className="mt-4 text-rose-600 dark:text-rose-400 text-center">
          Erro ao gerar relatório. Tente novamente mais tarde.
        </Texto>
      )}
    </Card>
  );
};
