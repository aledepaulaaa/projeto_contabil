import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar as CalendarIcon,
  Search,
  LayoutGrid,
  List,
  Download,
  Edit3,
  History,
  TrendingDown,
  Check,
  Phone,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { TimelineLateral } from '../../components/organisms/TimelineLateral/TimelineLateral';
import { DialogNovoLead } from '../../components/organisms/DialogNovoLead/DialogNovoLead';
import { ModalImportacaoLeads } from '../../components/organisms/DialogNovoLead/ModalImportacaoLeads';
import { ModalSelecaoOrigemLead } from '../../components/organisms/DialogNovoLead/ModalSelecaoOrigemLead';
import { LeadTable } from '../../components/organisms/ListaLeads/LeadTable';
import { StageLeadsModal } from '../../components/organisms/ListaLeads/StageLeadsModal';
import { ModalGerarRelatorio } from '../../components/organisms/ListaLeads/ModalGerarRelatorio';
import { useLeads } from '../../hooks/useLeads';
import type { LeadResponse } from '../../hooks/useLeads';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { ModalGerenciarEtapas } from '../../components/organisms/CRM/ModalGerenciarEtapas';
import { statusParaEtapa } from '../../consts/crm';
import { ModalObservacaoNaoFechamento } from '../../components/molecules/ModalObservacaoNaoFechamento/ModalObservacaoNaoFechamento';

// Componente Local de Card de Métrica
const MetricCard = ({ label, value, color, onClick }: any) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="cursor-pointer flex-1 min-w-[160px]"
  >
    <Card className="p-5 hover:border-blue-500/40 border-transparent transition-all group relative overflow-hidden h-full">
      <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 blur-2xl rounded-full -mr-8 -mt-8`} style={{ backgroundColor: color || '#3b82f6' }} />
      <div className="flex items-center justify-between mb-3">
        <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
          {label}
        </Texto>
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color || '#3b82f6' }} />
      </div>
      <div className="flex items-end gap-2">
        <Texto variant="titulo" className="leading-none">{value}</Texto>
        <Texto variant="detalhe" className="text-slate-400 mb-1">leads</Texto>
      </div>
    </Card>
  </motion.div>
);

export const CRM: React.FC = () => {
  const { leads, isLoading, deleteLead, moveLead, gerarContrato, refreshLeads } = useLeads();
  const { etapas } = useEtapasFunil();

  const [leadSelecionado, setLeadSelecionado] = useState<LeadResponse | null>(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);
  const [modalSelecaoAberto, setModalSelecaoAberto] = useState(false);
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [modalGerenciarEtapasAberto, setModalGerenciarEtapasAberto] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [etapaSelecionada, setEtapaSelecionada] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [naoFechouModal, setNaoFechouModal] = useState<{ id: string; nome: string } | null>(null);

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch =
      lead.nomeContato.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.nomeEmpresa?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());

    const leadDate = lead.criadoEm ? new Date(lead.criadoEm) : null;
    const matchesDate = (!dateFilter.start || (leadDate && leadDate >= new Date(dateFilter.start))) &&
      (!dateFilter.end || (leadDate && leadDate <= new Date(dateFilter.end)));

    return matchesSearch && matchesDate;
  }) || [];

  const leadsPorEtapa = (chaveEtapa: string) => {
    return filteredLeads.filter(l => (l.status === chaveEtapa || statusParaEtapa(l.status) === chaveEtapa));
  };

  const handleMudarEtapa = async (id: string, newStatus: string) => {
    if (newStatus === 'NAO_FECHOU') {
      const lead = leads?.find(l => l.id === id);
      setNaoFechouModal({ id, nome: lead?.nomeContato || 'Lead' });
      return;
    }
    try {
      const deptoId = localStorage.getItem('departamentoId');
      await moveLead({ id, status: newStatus, departamentoId: deptoId || undefined });
      setToast({ 
        message: `Lead movido para ${newStatus} com sucesso!`,
        type: 'success'
      });
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      console.error('Erro ao mover lead', e);
    }
  };

  const handleConfirmarNaoFechamento = async (observacao: string) => {
    if (naoFechouModal) {
      try {
        await moveLead({ id: naoFechouModal.id, status: 'NAO_FECHOU', observacao });
      } catch (e) {
        console.error('Erro ao mover lead para Não Fechou', e);
      }
      setNaoFechouModal(null);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
    } catch (e) {
      console.error('Falha ao excluir lead', e);
    }
  };

  const abrirTimeline = (lead: LeadResponse) => {
    setLeadSelecionado(lead);
    setTimelineAberta(true);
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in pb-24">
      <ModalSelecaoOrigemLead
        aberto={modalSelecaoAberto}
        onFechar={() => setModalSelecaoAberto(false)}
        onSelecionarManual={() => {
          setModalSelecaoAberto(false);
          setLeadSelecionado(null);
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

      <ModalGerarRelatorio
        aberto={modalRelatorioAberto}
        onFechar={() => setModalRelatorioAberto(false)}
        onSucesso={(msg) => {
          setToast({ message: msg, type: 'success' });
          setTimeout(() => setToast(null), 5000);
        }}
      />

      <ModalGerenciarEtapas
        aberto={modalGerenciarEtapasAberto}
        onFechar={() => setModalGerenciarEtapasAberto(false)}
      />

      <DialogNovoLead
        aberto={dialogNovoAberto}
        onFechar={() => {
          setDialogNovoAberto(false);
          setLeadSelecionado(null);
        }}
        onSucesso={() => {
          refreshLeads();
          setDialogNovoAberto(false);
          setLeadSelecionado(null);
        }}
        leadParaEdicao={leadSelecionado || undefined}
      />

      <StageLeadsModal
        aberto={!!etapaSelecionada}
        etapa={etapaSelecionada}
        onFechar={() => setEtapaSelecionada(null)}
        leads={etapaSelecionada ? leadsPorEtapa(etapaSelecionada.chave || etapaSelecionada.id) : []}
        isLoading={isLoading}
        onView={(l) => {
          setLeadSelecionado(l);
        }}
        onEdit={(l) => {
          setLeadSelecionado(l);
          setDialogNovoAberto(true);
        }}
        onDelete={handleDeleteLead}
        onMove={handleMudarEtapa}
        onHistory={abrirTimeline}
        onRetryContrato={async (contratoId) => {
          try {
            const { default: ContratoService } = await import('../../services/ContratoService');
            await ContratoService.retentarContrato(contratoId);
            refreshLeads();
          } catch (e) {
            console.error('Erro ao retentar geração do contrato', e);
          }
        }}
        onGerarContrato={async (leadId) => {
          try {
            await gerarContrato(leadId);
            refreshLeads();
          } catch (e) {
            console.error('Erro ao gerar contrato manualmente', e);
          }
        }}
      />

      <TimelineLateral
        aberta={timelineAberta}
        onFechar={() => setTimelineAberta(false)}
        leadId={leadSelecionado?.id || ''}
        nomeContato={leadSelecionado?.nomeContato || ''}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-20 left-1/2 z-[3000] px-6 py-3 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'
            }`}
          >
            {toast.type === 'success' ? <Check size={20} /> : <TrendingDown size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header com Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <Texto variant="titulo" className="mb-1">Central de Oportunidades</Texto>
          <Texto variant="corpo" className="text-text-secondary">Dashboard inteligente e gestão ativa de leads</Texto>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalGerenciarEtapasAberto(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <Settings size={15} /> Etapas do Funil
          </button>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={14} /> Cards
            </button>
          </div>
          <Botao
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setModalSelecaoAberto(true)}
          >
            <Plus size={18} /> Novo Lead
          </Botao>
        </div>
      </div>

      {/* Cards das Etapas do Funil Dinâmicas (Scroll Horizontal Responsivo) */}
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar flex-nowrap w-full">
        {etapas.map((etapa) => (
          <MetricCard
            key={etapa.chave}
            label={etapa.nome}
            value={leadsPorEtapa(etapa.chave).length}
            color={etapa.cor}
            onClick={() => setEtapaSelecionada({ ...etapa, id: etapa.chave, label: etapa.nome })}
          />
        ))}
      </div>

      {/* Área de Conteúdo Principal */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por nome, empresa ou e-mail..."
                className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <input
                  type="date"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 pl-8 shadow-sm text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                />
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              </div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">até</span>
              <div className="relative">
                <input
                  type="date"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 pl-8 shadow-sm text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                />
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Botao variant="outline" className="text-xs flex items-center gap-2" onClick={() => { setSearchQuery(''); setDateFilter({ start: '', end: '' }); }}>
              Limpar Filtros
            </Botao>
            <Botao variant="outline" className="text-xs flex items-center gap-2" onClick={() => setModalRelatorioAberto(true)}>
              <Download size={16} /> Relatórios
            </Botao>
          </div>
        </div>

        <div className="p-8 min-h-[400px]">
          {viewMode === 'table' ? (
            <LeadTable
              leads={filteredLeads}
              isLoading={isLoading}
              onView={(l) => {
                setLeadSelecionado(l);
                const etapaEncontrada = etapas.find(e => e.chave === l.status);
                setEtapaSelecionada(etapaEncontrada ? { ...etapaEncontrada, label: etapaEncontrada.nome } : null);
              }}
              onEdit={(l) => {
                setLeadSelecionado(l);
                setDialogNovoAberto(true);
              }}
              onDelete={handleDeleteLead}
              onMove={handleMudarEtapa}
              onHistory={abrirTimeline}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLeads.map(lead => {
                const etapa = etapas.find(e => e.chave === lead.status);
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-500/20 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        {lead.nomeEmpresa?.[0] || lead.nomeContato?.[0]}
                      </div>
                      <div className="px-2.5 py-1 rounded-full text-[9px] font-bold border text-white" style={{ backgroundColor: etapa?.cor || '#3b82f6' }}>
                        {etapa?.nome || lead.status}
                      </div>
                    </div>
                    <Texto variant="corpo" className="font-bold mb-1 truncate">{lead.nomeEmpresa || lead.nomeContato}</Texto>
                    <Texto variant="detalhe" className="text-slate-500 mb-2 truncate">{lead.email}</Texto>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {lead.telefone ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-lg border border-blue-500/10">
                          <Phone size={10} />
                          {lead.telefone}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                          <AlertTriangle size={10} />
                          Sem WhatsApp
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => abrirTimeline(lead)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-blue-500">
                        <History size={16} />
                      </button>
                      <button onClick={() => { setLeadSelecionado(lead); setDialogNovoAberto(true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-amber-500">
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setEtapaSelecionada(etapa ? { ...etapa, label: etapa.nome } : null)}
                        className="flex-1 text-[10px] font-bold py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 transition-colors text-center"
                      >
                        Ver Etapa
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Observação para Não Fechou */}
      <ModalObservacaoNaoFechamento
        aberto={!!naoFechouModal}
        nomeContato={naoFechouModal?.nome || ''}
        onConfirmar={handleConfirmarNaoFechamento}
        onFechar={() => setNaoFechouModal(null)}
      />
    </div>
  );
};
