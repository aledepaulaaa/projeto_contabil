import React, { useState } from 'react';
import { 
  Rocket, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  MessageSquare,
  Settings2
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { DialogNovoProcesso } from '../../components/organisms/DialogNovoProcesso/DialogNovoProcesso';
import { useLeads } from '../../hooks/useLeads';
import type { LeadResponse } from '../../hooks/useLeads';
import { TimelineLateral } from '../../components/organisms/TimelineLateral/TimelineLateral';

export const Onboarding: React.FC = () => {
  const { leads, isLoading } = useLeads();
  const [leadTimeline, setLeadTimeline] = useState<LeadResponse | null>(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [dialogProcessoAberto, setDialogProcessoAberto] = useState(false);

  // Parâmetros de Operação (local state — será conectado ao backend futuramente)
  const [parametros, setParametros] = useState({
    regimeTributario: '',
    segmento: '',
    dataInicioObrigatoriedade: '',
  });

  // Leads em processo de onboarding (QUALIFICADO ou CONVERTIDO)
  const leadsOnboarding = leads?.filter(l => 
    l.status === 'QUALIFICADO' || l.status === 'CONVERTIDO' || l.status === 'NEGOCIACAO'
  ) ?? [];

  const totalLeads = leads?.length ?? 0;
  const convertidos = leads?.filter(l => l.status === 'CONVERTIDO').length ?? 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONVERTIDO': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'QUALIFICADO': return <Clock size={16} className="text-blue-500" />;
      default: return <AlertCircle size={16} className="text-slate-500" />;
    }
  };

  const abrirTimeline = (lead: LeadResponse) => {
    setLeadTimeline(lead);
    setTimelineAberta(true);
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
        <Botao onClick={() => setDialogProcessoAberto(true)} className="md:w-auto px-6 flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Plus size={20} />
          Novo Processo
        </Botao>
      </div>

      {/* Grid de Resumo — Dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total de Leads', value: isLoading ? '—' : String(totalLeads), detail: `${convertidos} convertidos`, icon: User, color: 'text-emerald-600 dark:text-emerald-400', detailIcon: CheckCircle2 },
          { label: 'Em Implantação', value: isLoading ? '—' : String(leadsOnboarding.length), detail: 'Aguardando documentação', icon: Clock, color: 'text-blue-600 dark:text-blue-400', detailIcon: ArrowRight },
          { label: 'Reuniões Pendentes', value: isLoading ? '—' : String(Math.max(0, leadsOnboarding.length - convertidos)), detail: 'Próximos 7 dias', icon: Calendar, color: 'text-slate-500 dark:text-slate-500', detailIcon: Calendar },
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
        {/* Lista de Leads em Onboarding — Dados reais */}
        <div className="lg:col-span-2 space-y-4">
          <Texto variant="subtitulo" className="flex items-center gap-2">
            Clientes em Adoção
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-text-secondary font-mono">
              {leadsOnboarding.length}
            </span>
          </Texto>
          
          {leadsOnboarding.length === 0 && !isLoading ? (
            <Card className="p-8 text-center">
              <Texto variant="corpo" className="text-text-secondary">Nenhum lead em processo de onboarding.</Texto>
              <Texto variant="detalhe" className="mt-1">Converta leads no CRM para iniciar o onboarding.</Texto>
            </Card>
          ) : (
            <div className="space-y-3">
              {leadsOnboarding.map((lead) => (
                <Card 
                  key={lead.id}
                  noPadding
                  variant="flat"
                  className="p-4 flex items-center justify-between group hover:border-blue-500/30 dark:hover:border-slate-700 cursor-pointer"
                  onClick={() => abrirTimeline(lead)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center transition-colors shadow-sm dark:shadow-none">
                      {getStatusIcon(lead.status)}
                    </div>
                    <div>
                      <Texto variant="corpo" className="font-semibold">{lead.nomeEmpresa || lead.nomeContato}</Texto>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-text-secondary">
                        <span className="flex items-center gap-1 font-medium">
                          <User size={12} />
                          {lead.nomeContato}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[9px] uppercase">
                          {lead.status}
                        </span>
                        {lead.tipoServico && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[9px] uppercase">
                            {lead.tipoServico}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-white transition-all">
                    <MessageSquare size={18} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Card Parâmetros de Operação */}
          <Card>
            <Texto variant="subtitulo" className="text-sm mb-4 flex items-center gap-2">
              <Settings2 size={16} className="text-blue-500" />
              Parâmetros de Operação
            </Texto>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">Regime Tributário</label>
                <select 
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  value={parametros.regimeTributario}
                  onChange={e => setParametros(p => ({ ...p, regimeTributario: e.target.value }))}
                >
                  <option value="">Selecionar...</option>
                  <option value="MEI">MEI</option>
                  <option value="SIMPLES">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">Segmento</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  value={parametros.segmento}
                  onChange={e => setParametros(p => ({ ...p, segmento: e.target.value }))}
                >
                  <option value="">Selecionar...</option>
                  <option value="COMERCIO">Comércio</option>
                  <option value="SERVICOS">Serviços</option>
                  <option value="INDUSTRIA">Indústria</option>
                  <option value="CONSTRUCAO">Construção Civil</option>
                  <option value="SAUDE">Saúde</option>
                  <option value="TECNOLOGIA">Tecnologia</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">Data de Início da Obrigatoriedade</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  value={parametros.dataInicioObrigatoriedade}
                  onChange={e => setParametros(p => ({ ...p, dataInicioObrigatoriedade: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 p-6 rounded-2xl transition-colors">
            <Texto variant="corpo" className="text-blue-600 dark:text-blue-400 font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Dica Pro
            </Texto>
            <Texto variant="detalhe" className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Clientes que realizam a reunião de alinhamento nas primeiras 48h têm uma taxa de retenção 40% maior. Priorize os agendamentos imediatos.
            </Texto>
          </div>
        </div>
      </div>

      {/* Timeline Lateral */}
      <TimelineLateral
        leadId={leadTimeline?.id ?? null}
        nomeContato={leadTimeline?.nomeContato ?? ''}
        aberta={timelineAberta}
        onFechar={() => setTimelineAberta(false)}
      />

      <DialogNovoProcesso
        aberto={dialogProcessoAberto}
        onFechar={() => setDialogProcessoAberto(false)}
      />
    </div>
  );
};
