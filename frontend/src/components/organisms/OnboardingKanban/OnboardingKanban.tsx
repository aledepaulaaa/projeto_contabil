import React, { useState } from 'react';
import { 
  ClipboardList, 
  PlayCircle, 
  CheckCircle2, 
  Calendar,
  MoreVertical,
  Plus,
  Flag,
  CheckSquare,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../atoms/Card/Card';
import { Texto } from '../../atoms/Texto/Texto';
import { TarefaDetalhesModal } from '../TarefaDetalhesModal/TarefaDetalhesModal';
import { useOnboarding } from '../../../hooks/useOnboarding';
import type { TarefaOnboarding, PrioridadeTarefa } from '../../../services/OnboardingService';

interface OnboardingKanbanProps {
  onboardingId: string;
  tarefas: TarefaOnboarding[];
}

export const OnboardingKanban: React.FC<OnboardingKanbanProps> = ({ 
  onboardingId,
  tarefas
}) => {
  const { adicionarTarefa, editarTarefa, excluirTarefa, moverTarefa } = useOnboarding();
  const [tarefaSelecionada, setTarefaSelecionada] = useState<TarefaOnboarding | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const colunas = [
    { id: 'A_FAZER', titulo: 'A Fazer', icon: ClipboardList, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { id: 'EM_ANDAMENTO', titulo: 'Em Andamento', icon: PlayCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'CONCLUIDO', titulo: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const getTarefasDaColuna = (status: string) => tarefas.filter(t => t.status === status);

  const getPrioridadeColor = (p: PrioridadeTarefa) => {
    switch (p) {
      case 'BAIXA': return 'bg-slate-500';
      case 'MEDIA': return 'bg-blue-500';
      case 'ALTA': return 'bg-orange-500';
      case 'URGENTE': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const handleAbrirTarefa = (tarefa: TarefaOnboarding) => {
    setTarefaSelecionada(tarefa);
    setModalAberto(true);
  };

  const handleNovaTarefa = async (statusId: string) => {
    await adicionarTarefa({ 
      id: onboardingId, 
      tarefa: { 
        titulo: 'Nova Tarefa', 
        descricao: '', 
        status: statusId as TarefaOnboarding['status'],
        prioridade: 'MEDIA',
        checklist: []
      } 
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
      {colunas.map((coluna) => (
        <div key={coluna.id} className="flex flex-col gap-4">
          {/* Header Coluna */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${coluna.bg} ${coluna.color} rounded-lg`}>
                <coluna.icon size={16} />
              </div>
              <Texto variant="subtitulo" className="text-sm font-bold uppercase tracking-wider opacity-80">
                {coluna.titulo}
              </Texto>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-text-secondary font-mono">
                {getTarefasDaColuna(coluna.id).length}
              </span>
            </div>
          </div>

          {/* Cards da Coluna */}
          <div 
            className="flex-1 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-inner transition-colors duration-200"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('bg-blue-500/5');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-blue-500/5');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-blue-500/5');
              const tarefaId = e.dataTransfer.getData('tarefaId');
              if (tarefaId) {
                moverTarefa({ tarefaId, status: coluna.id });
              }
            }}
          >
            {getTarefasDaColuna(coluna.id).map((tarefa) => {
              const checklistConcluido = tarefa.checklist?.filter(i => i.concluido).length || 0;
              const checklistTotal = tarefa.checklist?.length || 0;

              return (
                <Card 
                  key={tarefa.id} 
                  variant="flat" 
                  noPadding 
                  className="p-4 group hover:shadow-xl hover:translate-y-[-2px] hover:border-blue-500/30 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700 relative overflow-hidden"
                  draggable
                  onDragStart={(e: any) => {
                    e.dataTransfer.setData('tarefaId', tarefa.id);
                    e.currentTarget.style.opacity = '0.4';
                  }}
                  onDragEnd={(e: any) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onClick={() => handleAbrirTarefa(tarefa)}
                >
                  {/* Priority Indicator Line */}
                  <div className={`absolute top-0 left-0 w-full h-[3px] ${getPrioridadeColor(tarefa.prioridade)} opacity-60`} />

                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1">
                      <Texto variant="corpo" className="font-bold text-sm leading-tight group-hover:text-blue-600 transition-colors">
                        {tarefa.titulo}
                      </Texto>
                    </div>
                    <div className="flex items-center gap-1">
                      {tarefa.status !== 'A_FAZER' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); moverTarefa({ tarefaId: tarefa.id, status: 'A_FAZER' }); }}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-all"
                          title="Mover para A Fazer"
                        >
                          <ArrowRight size={14} className="rotate-180" />
                        </button>
                      )}
                      {tarefa.status !== 'CONCLUIDO' && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const novoStatus = tarefa.status === 'A_FAZER' ? 'EM_ANDAMENTO' : 'CONCLUIDO';
                            moverTarefa({ tarefaId: tarefa.id, status: novoStatus }); 
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-all"
                          title="Mover para Próxima Etapa"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <Texto variant="detalhe" className="line-clamp-2 mb-4 text-[11px] opacity-70">
                    {tarefa.descricao || 'Sem descrição...'}
                  </Texto>

                  <div className="flex flex-wrap gap-2 mb-4">
                     {tarefa.prioridade !== 'MEDIA' && (
                       <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${getPrioridadeColor(tarefa.prioridade)}/10 ${getPrioridadeColor(tarefa.prioridade).replace('bg-', 'text-')}`}>
                          <Flag size={10} />
                          {tarefa.prioridade}
                       </div>
                     )}
                     {checklistTotal > 0 && (
                        <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${checklistConcluido === checklistTotal ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                           <CheckSquare size={10} />
                           {checklistConcluido}/{checklistTotal}
                        </div>
                     )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-1 text-[10px] text-text-secondary font-medium">
                      <Calendar size={12} className="opacity-60" />
                      {tarefa.dataFim ? new Date(tarefa.dataFim).toLocaleDateString('pt-BR') : 'Sem prazo'}
                    </div>
                    
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-600">
                      OP
                    </div>
                  </div>
                </Card>
              );
            })}

            {getTarefasDaColuna(coluna.id).length === 0 && (
              <div className="h-16 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl mb-2">
                 <Texto variant="detalhe" className="opacity-40 uppercase tracking-widest text-[9px] font-bold">Vazio</Texto>
              </div>
            )}

            {/* Botão Adicionar (Estilo Trello) */}
            <button 
              onClick={() => handleNovaTarefa(coluna.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 transition-all group"
            >
              <div className="w-5 h-5 flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-500/20 transition-colors">
                <Plus size={14} className="opacity-70 group-hover:opacity-100" />
              </div>
              <Texto variant="detalhe" className="font-semibold group-hover:font-bold">Adicionar cartão</Texto>
            </button>
          </div>
        </div>
      ))}

      {/* Modal de Detalhes */}
      <TarefaDetalhesModal
        tarefa={tarefaSelecionada}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvar={async (t) => {
          if (tarefaSelecionada) {
            await editarTarefa({ tarefaId: tarefaSelecionada.id, tarefa: t });
          }
        }}
        onExcluir={async (id) => {
          await excluirTarefa(id);
          setModalAberto(false);
        }}
      />
    </div>
  );
};
