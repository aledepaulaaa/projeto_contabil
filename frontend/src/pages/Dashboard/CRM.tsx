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
  TrendingUp,
  TrendingDown,
  Check
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
import { statusParaEtapa, etapas } from '../../consts/crm';

// Componente Local de Card de Métrica
const MetricCard = ({ label, value, tendency, color, onClick }: any) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="cursor-pointer"
  >
    <Card className="p-5 hover:border-blue-500/40 border-transparent transition-all group relative overflow-hidden h-full">
      <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 blur-2xl rounded-full -mr-8 -mt-8 ${color.replace('text', 'bg')}`} />
      <div className="flex items-center justify-between mb-3">
        <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
          {label}
        </Texto>
        {tendency && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${tendency.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
            {tendency.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {tendency}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <Texto variant="titulo" className="leading-none">{value}</Texto>
        <Texto variant="detalhe" className="text-slate-400 mb-1">leads</Texto>
      </div>
    </Card>
  </motion.div>
);

export const CRM: React.FC = () => {
  const { leads, isLoading, deleteLead, moveLead, refreshLeads } = useLeads();
  const [leadSelecionado, setLeadSelecionado] = useState<LeadResponse | null>(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);
  const [modalSelecaoAberto, setModalSelecaoAberto] = useState(false);
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  
  const [etapaSelecionada, setEtapaSelecionada] = useState<typeof etapas[0] | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

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

  const leadsPorEtapa = (etapaId: string) => {
    return filteredLeads.filter(l => statusParaEtapa(l.status) === etapaId);
  };

  const handleMudarEtapa = async (id: string, newStatus: string) => {
    try {
      await moveLead({ id, status: newStatus });
    } catch (e) {
      console.error('Erro ao mover lead', e);
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
    <div className="p-6 lg:p-10 space-y-10 animate-fade-in pb-24">
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
          setReportSuccessMsg(msg);
          setTimeout(() => setReportSuccessMsg(null), 5000);
        }}
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
        leads={etapaSelecionada ? leadsPorEtapa(etapaSelecionada.id) : []}
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
      />

      <TimelineLateral 
        aberta={timelineAberta}
        onFechar={() => setTimelineAberta(false)}
        leadId={leadSelecionado?.id || ''}
        nomeContato={leadSelecionado?.nomeContato || ''}
      />

      <AnimatePresence>
        {reportSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400"
          >
            <Check size={20} />
            {reportSuccessMsg}
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

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {etapas.map((etapa) => (
          <MetricCard
            key={etapa.id}
            label={etapa.label}
            value={leads?.filter(l => statusParaEtapa(l.status) === etapa.id).length || 0}
            tendency="+5%"
            color={etapa.color}
            onClick={() => setEtapaSelecionada(etapa)}
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
                setEtapaSelecionada(etapas.find(e => e.id === statusParaEtapa(l.status)) || null);
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
                const etapa = etapas.find(e => e.id === statusParaEtapa(lead.status));
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
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${etapa?.color}`}>
                        {etapa?.label}
                      </div>
                    </div>
                    <Texto variant="corpo" className="font-bold mb-1 truncate">{lead.nomeEmpresa || lead.nomeContato}</Texto>
                    <Texto variant="detalhe" className="text-slate-500 mb-4 truncate">{lead.email}</Texto>
                    
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => abrirTimeline(lead)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-blue-500">
                        <History size={16} />
                      </button>
                      <button onClick={() => { setLeadSelecionado(lead); setDialogNovoAberto(true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-amber-500">
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setEtapaSelecionada(etapa || null)} 
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
    </div>
  );
};
