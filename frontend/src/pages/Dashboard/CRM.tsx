import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Phone,
  ArrowRight,
  Tag,
  Briefcase,
  History
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { TimelineLateral } from '../../components/organisms/TimelineLateral/TimelineLateral';
import { DialogNovoLead } from '../../components/organisms/DialogNovoLead/DialogNovoLead';
import { ModalImportacaoLeads } from '../../components/organisms/DialogNovoLead/ModalImportacaoLeads';
import { ModalSelecaoOrigemLead } from '../../components/organisms/DialogNovoLead/ModalSelecaoOrigemLead';
import { useLeads } from '../../hooks/useLeads';
import type { LeadResponse } from '../../hooks/useLeads';
import { statusParaEtapa, etapas, origemLabel, tipoServicoLabel } from '../../consts/crm';

export const CRM: React.FC = () => {
  const { leads, isLoading, refreshLeads } = useLeads();
  const [leadSelecionado, setLeadSelecionado] = useState<LeadResponse | null>(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);
  const [modalSelecaoAberto, setModalSelecaoAberto] = useState(false);
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);

  const leadsPorEtapa = (etapaId: string) => {
    if (!leads) return [];
    return leads.filter(l => statusParaEtapa(l.status) === etapaId);
  };

  const abrirTimeline = (lead: LeadResponse) => {
    setLeadSelecionado(lead);
    setTimelineAberta(true);
  };

  return (
    <div className="space-y-8">
      <ModalSelecaoOrigemLead
        aberto={modalSelecaoAberto}
        onFechar={() => setModalSelecaoAberto(false)}
        onSelecionarManual={() => {
          setModalSelecaoAberto(false);
          setDialogNovoAberto(true);
        }}
        onSelecionarImportar={() => {
          setModalSelecaoAberto(false);
          setModalImportacaoAberto(true);
        }}
      />

      <ModalImportacaoLeads
        aberto={modalImportacaoAberto}
        onFechar={() => setModalImportacaoAberto(false)}
        onSucesso={() => refreshLeads()}
      />

      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Texto variant="titulo" className="flex items-center gap-3">
            <Users className="text-blue-600 dark:text-blue-500" size={28} />
            Gestão de Leads
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Acompanhe o funil de vendas e conversão de novos clientes</Texto>
        </div>
        <div className="flex items-center gap-3">
          <Botao onClick={() => setModalSelecaoAberto(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Novo Lead
          </Botao>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 transition-colors">
        {etapas.map((etapa) => (
          <Card key={etapa.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${etapa.color} transition-colors`}>
                <etapa.icon size={16} />
              </div>
              <Texto variant="titulo" className="text-xl">
                {isLoading ? '—' : leadsPorEtapa(etapa.id).length}
              </Texto>
            </div>
            <Texto variant="label" className="text-[10px]">{etapa.label}</Texto>
          </Card>
        ))}
      </div>

      {/* Kanban / Lista — 6 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {etapas.map((etapa) => (
          <div key={etapa.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <Texto variant="label" className="flex items-center gap-1.5 text-[10px]">
                <span className={`w-2 h-2 rounded-full ${etapa.color.replace('text', 'bg')} transition-all`} />
                {etapa.label}
              </Texto>
              <Texto variant="detalhe" className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 transition-colors text-[9px]">
                {isLoading ? '...' : leadsPorEtapa(etapa.id).length}
              </Texto>
            </div>

            <div className="flex flex-col gap-2 min-h-[180px]">
              {leadsPorEtapa(etapa.id).map((lead) => (
                <Card
                  as={motion.div}
                  key={lead.id}
                  className="p-3 hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <Texto variant="corpo" className="font-medium text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                      {lead.nomeEmpresa || lead.nomeContato}
                    </Texto>
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirTimeline(lead); }}
                      className="text-text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
                      title="Ver Timeline"
                    >
                      <History size={14} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <Texto variant="detalhe" className="flex items-center gap-1.5 text-[10px]">
                      <Phone size={10} />
                      {lead.email || 'Sem contato'}
                    </Texto>

                    {/* Tags de Origem e Tipo de Serviço */}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {lead.origemLead && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <Tag size={7} />
                          {origemLabel(lead.origemLead)}
                        </span>
                      )}
                      {lead.tipoServico && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          <Briefcase size={7} />
                          {tipoServicoLabel(lead.tipoServico)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button className="w-full mt-3 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-bold text-text-secondary hover:text-text-main bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    Mover Etapa
                    <ArrowRight size={10} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Lateral */}
      <TimelineLateral
        leadId={leadSelecionado?.id ?? null}
        nomeContato={leadSelecionado?.nomeContato ?? ''}
        aberta={timelineAberta}
        onFechar={() => setTimelineAberta(false)}
      />

      {/* Dialog Novo Lead Multi-step */}
      <DialogNovoLead
        aberto={dialogNovoAberto}
        onFechar={() => setDialogNovoAberto(false)}
        onSucesso={() => refreshLeads()}
      />
    </div>
  );
};
