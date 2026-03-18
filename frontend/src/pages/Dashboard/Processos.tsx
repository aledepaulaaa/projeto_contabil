import React from 'react';
import { 
  Briefcase, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

export const Processos: React.FC = () => {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Texto variant="titulo" className="flex items-center gap-3">
            <Briefcase className="text-blue-600 dark:text-blue-500" size={28} />
            Processos Operacionais
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Acompanhamento de legalização, aberturas e alterações contratuais</Texto>
        </div>
        <Botao className="md:w-auto px-6 flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Plus size={20} />
          Novo Processo
        </Botao>
      </div>

      {/* Kanban View Simplificada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: 'Triagem / Início', count: 5, color: 'border-blue-500' },
          { title: 'Em Andamento', count: 12, color: 'border-amber-500' },
          { title: 'Finalizados (Mês)', count: 8, color: 'border-emerald-500' },
        ].map((col, i) => (
          <Card key={i} noPadding className={`bg-white/50 dark:bg-slate-900/40 border-l-4 ${col.color} p-5 rounded-l-none`}>
            <div className="flex justify-between items-center mb-4 text-text-main">
              <Texto variant="label">{col.title}</Texto>
              <Texto variant="detalhe" className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">{col.count}</Texto>
            </div>
            <div className="space-y-3">
              {[1, 2].map((_, j) => (
                <Card key={j} variant="flat" className="p-3 hover:border-blue-500/30 dark:hover:border-slate-700 transition-all cursor-pointer">
                  <Texto variant="corpo" className="font-bold mb-1">Abertura: {j === 0 ? 'Fênix Tecnologia' : 'Padaria Modelo'}</Texto>
                  <Texto variant="detalhe">Última atualização: Hoje às 10h</Texto>
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Texto variant="subtitulo" className="flex items-center gap-2">
            Atualizações Recentes
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-500/20 transition-colors">Tempo Real</span>
          </Texto>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 transition-colors">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <Texto variant="corpo" className="font-semibold">DBE Aprovado - Posto Central</Texto>
                  <Texto variant="detalhe">Protocolo: SP12345678</Texto>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold transition-colors">Ver Detalhes</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
