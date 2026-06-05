import React, { useState } from 'react';
import { 
  Briefcase, 
  CheckCircle2,
  Plus,
  Layout
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

export const Processos: React.FC = () => {
  const [processos] = useState<any[]>([]);
  const [atualizacoes] = useState<any[]>([]);

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
          { title: 'Triagem / Início', color: 'border-blue-500', status: 'TRIAGEM' },
          { title: 'Em Andamento', color: 'border-amber-500', status: 'EM_ANDAMENTO' },
          { title: 'Finalizados (Mês)', color: 'border-emerald-500', status: 'FINALIZADO' },
        ].map((col, i) => {
          const list = processos.filter(p => p.status === col.status);
          
          return (
            <Card key={i} noPadding className={`bg-white/50 dark:bg-slate-900/40 border-l-4 ${col.color} p-5 rounded-l-none`}>
              <div className="flex justify-between items-center mb-4 text-text-main">
                <Texto variant="label">{col.title}</Texto>
                <Texto variant="detalhe" className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">{list.length}</Texto>
              </div>
              <div className="space-y-3">
                {list.map((p, j) => (
                  <Card key={j} variant="flat" className="p-3 hover:border-blue-500/30 dark:hover:border-slate-700 transition-all cursor-pointer">
                    <Texto variant="corpo" className="font-bold mb-1">{p.descricao}</Texto>
                    <Texto variant="detalhe">Última atualização: {new Date(p.criadoEm).toLocaleDateString()}</Texto>
                  </Card>
                ))}
                
                {list.length === 0 && (
                  <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Texto variant="detalhe" className="text-slate-400">Sem processos</Texto>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Texto variant="subtitulo" className="flex items-center gap-2">
            Atualizações Recentes
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-500/20 transition-colors">Tempo Real</span>
          </Texto>
        </div>
        <div className="space-y-4">
          {atualizacoes.map((at, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 transition-colors">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <Texto variant="corpo" className="font-semibold">{at.titulo}</Texto>
                  <Texto variant="detalhe">{at.descricao}</Texto>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold transition-colors">Ver Detalhes</button>
            </div>
          ))}

          {atualizacoes.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 transition-colors">
                <Layout size={32} />
              </div>
              <Texto variant="corpo" className="font-semibold text-slate-500">Nenhuma atualização recente</Texto>
              <Texto variant="detalhe" className="mt-1">As atividades dos processos aparecerão aqui em tempo real.</Texto>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
