import React, { useState } from 'react';
import {  } from 'framer-motion';
import { 
  Rocket, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

interface TarefaOnboarding {
  id: string;
  titulo: string;
  responsavel: string;
  prazo: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
}

const tarefasIniciais: TarefaOnboarding[] = [
  { id: '1', titulo: 'Coleta de Documentos Iniciais', responsavel: 'Ana Silva', prazo: '2024-03-20', status: 'CONCLUIDO' },
  { id: '2', titulo: 'Configuração de Acesso RFB', responsavel: 'Carlos Souza', prazo: '2024-03-22', status: 'EM_ANDAMENTO' },
  { id: '3', titulo: 'Reunião de Alinhamento de Expectativas', responsavel: 'Diretoria', prazo: '2024-03-25', status: 'PENDENTE' },
];

export const Onboarding: React.FC = () => {
  const [tarefas] = useState<TarefaOnboarding[]>(tarefasIniciais);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONCLUIDO': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'EM_ANDAMENTO': return <Clock size={16} className="text-blue-500" />;
      default: return <AlertCircle size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Texto variant="titulo" className="flex items-center gap-3">
            <Rocket className="text-blue-600 dark:text-blue-500" size={28} />
            Onboarding & Adoção
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">
            Acompanhamento de novos clientes e alinhamento de processos
          </Texto>
        </div>
        <Botao className="md:w-auto px-6 flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Plus size={20} />
          Novo Processo
        </Botao>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Prazo Médio', value: '12 Dias', detail: '-2 dias este mês', icon: Clock, color: 'text-emerald-600 dark:text-emerald-400', detailIcon: ArrowRight },
          { label: 'Reuniões Agendadas', value: '4', detail: 'Próxima: Amanhã às 14h', icon: Calendar, color: 'text-blue-600 dark:text-blue-400', detailIcon: Calendar },
          { label: 'Clientes em Adoção', value: '8', detail: '3 aguardando contato', icon: User, color: 'text-slate-500 dark:text-slate-500', detailIcon: User },
        ].map((stat, i) => (
          <Card key={i} className="hover:border-blue-500/30 transition-all">
            <Texto variant="label" className="mb-4">{stat.label}</Texto>
            <Texto variant="titulo">{stat.value}</Texto>
            <div className={`mt-2 text-xs ${stat.color} flex items-center gap-1 font-medium`}>
              <stat.detailIcon size={12} />
              {stat.detail}
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Tarefas */}
        <div className="lg:col-span-2 space-y-4">
          <Texto variant="subtitulo" className="flex items-center gap-2">
            Tarefas de Implantação
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-text-secondary font-mono">
              {tarefas.length}
            </span>
          </Texto>
          
          <div className="space-y-3">
            {tarefas.map((tarefa) => (
              <Card 
                key={tarefa.id}
                noPadding
                variant="flat"
                className="p-4 flex items-center justify-between group hover:border-blue-500/30 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center transition-colors shadow-sm dark:shadow-none`}>
                    {getStatusIcon(tarefa.status)}
                  </div>
                  <div>
                    <Texto variant="corpo" className="font-semibold">{tarefa.titulo}</Texto>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-text-secondary">
                      <span className="flex items-center gap-1 font-medium">
                        <User size={12} />
                        {tarefa.responsavel}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar size={12} />
                        {new Date(tarefa.prazo).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-white transition-all">
                  <MessageSquare size={18} />
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Informativa */}
        <div className="space-y-6">
          <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 p-6 rounded-2xl transition-colors">
            <Texto variant="corpo" className="text-blue-600 dark:text-blue-400 font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Dica Pro
            </Texto>
            <Texto variant="detalhe" className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Clientes que realizam a reunião de alinhamento nas primeiras 48h têm uma taxa de retenção 40% maior. Priorize os agendamentos imediatos.
            </Texto>
          </div>

          <Card>
            <Texto variant="subtitulo" className="text-sm mb-4">Cronograma de Reuniões</Texto>
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1">
                  <div>
                    <Texto variant="label" className="text-[10px] mb-1">Amanhã, 14:00</Texto>
                    <Texto variant="corpo" className="text-slate-700 dark:text-slate-200 font-semibold tracking-tight">Kickoff: Restaurante Divino</Texto>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-xs text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-bold transition-colors uppercase tracking-wider">
              Ver calendário completo
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
