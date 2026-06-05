import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  History,
  Sparkles,
  Building2,
  Plus,
  FileSpreadsheet,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  X,
  Users,
  Search
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { useOnboarding } from '../../hooks/useOnboarding';
import { TimelineLateral } from '../../components/organisms/TimelineLateral/TimelineLateral';
import { OnboardingKanban } from '../../components/organisms/OnboardingKanban/OnboardingKanban';
import { ResumoIAPanel } from '../../components/molecules/ResumoIAPanel/ResumoIAPanel';
import { useLeads, type LeadResponse } from '../../hooks/useLeads';
import { TabelaGenerica, type ColunaTabela } from '../../components/organisms/TabelaGenerica/TabelaGenerica';
import { getRegimeColor, type Empresa } from '../../consts/onboarding';
import { ModalCadastroEmpresa } from '../../components/organisms/Onboarding/ModalCadastroEmpresa';
import { useEmpresas } from '../../hooks/useEmpresas';
import { toast } from 'react-hot-toast';

export const Onboarding: React.FC = () => {
  const { onboarding, isLoading: isLoadingOnboarding, atualizarResumo } = useOnboarding();
  const [selectedOnboardingId, setSelectedOnboardingId] = useState<string | null>(null);
  const [leadTimeline, setLeadTimeline] = useState<any | null>(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [activeTab, setActiveTab] = useState<'onboarding' | 'empresas'>('onboarding');
  const [isModalCadastroOpen, setIsModalCadastroOpen] = useState(false);

  const { empresas, isLoading: isLoadingEmpresas, criarEmpresa, atualizarEmpresa, importarEmpresas } = useEmpresas();
  const [empresaDetalhes, setEmpresaDetalhes] = useState<Empresa | null>(null);
  const [empresaParaEdicao, setEmpresaParaEdicao] = useState<Empresa | null>(null);
  
  // Filtros e Busca
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroRegime, setFiltroRegime] = useState<string>('TODOS');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatarIdentificacao = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return val;
  };

  const colunasEmpresas: ColunaTabela<Empresa>[] = [
    {
      chave: 'codigo',
      titulo: 'Cód.',
      largura: 'col-span-1',
      renderizar: (e) => (
        <Texto variant="detalhe" className="font-bold text-blue-400">
          #{e.identificadorInterno || '---'}
        </Texto>
      )
    },
    {
      chave: 'empresa',
      titulo: 'Empresa',
      largura: 'col-span-4',
      renderizar: (e) => (
        <div className="flex flex-col">
          <Texto variant="corpo" className="font-bold truncate">{e.razaoSocial}</Texto>
          <Texto variant="detalhe" className="text-slate-500 truncate">{e.nomeFantasia || '---'}</Texto>
        </div>
      )
    },
    {
      chave: 'identificacao',
      titulo: 'Documento',
      largura: 'col-span-2',
      renderizar: (e) => (
        <Texto variant="detalhe" className="font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
          {formatarIdentificacao(e.identificacao)}
        </Texto>
      )
    },
    {
      chave: 'regime',
      titulo: 'Regime',
      largura: 'col-span-2',
      renderizar: (e) => {
        const colors: Record<string, string> = {
          'SIMPLES': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'MEI': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          'PRESUMIDO': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          'REAL': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };
        return (
          <div className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold border ${colors[e.regimeTributario] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            {e.regimeTributario}
          </div>
        );
      }
    },
    {
      chave: 'status',
      titulo: 'Status',
      largura: 'col-span-1',
      renderizar: (e) => (
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${e.ativa ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <Texto variant="detalhe">{e.ativa ? 'Ativa' : 'Inativa'}</Texto>
        </div>
      )
    },
    {
      chave: 'acoes',
      titulo: 'Ação',
      largura: 'col-span-2',
      renderizar: (e) => (
        <div className="flex justify-end pr-2">
          <button 
            onClick={(ev) => { ev.stopPropagation(); setEmpresaDetalhes(e); }}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-blue-400 group"
          >
            <Eye size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )
    }
  ];

  // Lógica de Filtragem
  const empresasFiltradas = empresas.filter(e => {
    const matchesSearch = 
      e.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.identificacao.includes(searchQuery) ||
      (e.identificadorInterno?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesRegime = filtroRegime === 'TODOS' || e.regimeTributario === filtroRegime;
    
    return matchesSearch && matchesRegime;
  });

  // Paginação
  const totalPaginas = Math.ceil(empresasFiltradas.length / itensPorPagina);
  const empresasPaginadas = empresasFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const selectedOnboarding = onboarding?.find(o => o.id === selectedOnboardingId);
  const { leads } = useLeads();

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

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'onboarding'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Rocket size={16} />
            Adoção
          </button>
          <button
            onClick={() => {
              setActiveTab('empresas');
              setSelectedOnboardingId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'empresas'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Building2 size={16} />
            Empresas
          </button>
        </div>
      </div>

      {/* Grid de Resumo — Dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: 'Total de Leads', 
            value: isLoadingOnboarding ? '—' : String(totalLeads), 
            detail: `${convertidos} convertidos (${totalLeads > 0 ? Math.round((convertidos/totalLeads)*100) : 0}%)`, 
            icon: User, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            detailIcon: CheckCircle2 
          },
          { 
            label: 'Em Implantação', 
            value: isLoadingOnboarding ? '—' : String(onboarding?.length || 0), 
            detail: onboarding?.some(o => o.status === 'AGUARDANDO_PARAMETRIZACAO') ? 'Pendências detectadas' : 'Fluxo normal', 
            icon: Clock, 
            color: 'text-blue-600 dark:text-blue-400', 
            detailIcon: ArrowRight 
          },
          { 
            label: 'Taxa de Adoção', 
            value: isLoadingOnboarding ? '—' : '94%', 
            detail: 'Engajamento alto', 
            icon: Calendar, 
            color: 'text-purple-600 dark:text-purple-400', 
            detailIcon: Sparkles 
          },
        ].map((stat, i) => (
          <Card key={i} className="hover:border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/5">
            <div className="flex justify-between items-start">
               <div>
                  <Texto variant="label" className="mb-4 uppercase tracking-widest opacity-60">{stat.label}</Texto>
                  <Texto variant="titulo" className="text-3xl">{stat.value}</Texto>
               </div>
               <div className={`p-3 rounded-2xl ${stat.color.replace('text-', 'bg-')}/10 ${stat.color}`}>
                  <stat.icon size={24} />
               </div>
            </div>
            <div className={`mt-4 text-[11px] ${stat.color} flex items-center gap-1.5 font-bold`}>
              <stat.detailIcon size={14} />
              {stat.detail}
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === 'onboarding' ? (
        !selectedOnboarding ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Clientes em Onboarding */}
            <div className="lg:col-span-2 space-y-4">
              <Texto variant="subtitulo" className="flex items-center gap-2">
                Clientes em Adoção
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-text-secondary font-mono">
                  {onboarding?.length || 0}
                </span>
              </Texto>

              {onboarding?.length === 0 && !isLoadingOnboarding ? (
                <Card className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-2">
                  <Texto variant="corpo" className="text-text-secondary">Nenhum lead em processo de onboarding.</Texto>
                  <Texto variant="detalhe" className="mt-1">Converta leads no CRM para iniciar o onboarding automaticamente.</Texto>
                </Card>
              ) : (
                <div className="space-y-3">
                  {onboarding?.map((item) => {
                    const lead = leads?.find(l => l.id === item.leadId);
                    const nomeCliente = lead?.nomeEmpresa || lead?.nomeContato || `Cliente ${item.leadId.substring(0, 8)}`;

                    return (
                      <Card
                        key={item.id}
                        noPadding
                        variant="flat"
                        className="p-4 flex items-center justify-between group hover:border-blue-500/30 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all"
                      >
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => setSelectedOnboardingId(item.id)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
                            {getStatusIcon(lead?.status || '')}
                          </div>
                          <div>
                            <Texto variant="corpo" className="font-bold">{nomeCliente}</Texto>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-text-secondary">
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[9px] uppercase">
                                {item.status}
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <ClipboardList size={12} />
                                {item.tarefas.length} Tarefas
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Botao
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (lead) abrirTimeline(lead);
                            }}
                            title="Ver Timeline"
                          >
                            <History size={16} />
                          </Botao>
                          <ArrowRight size={18} className="text-slate-300 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Board do Cliente Selecionado */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb / Back button */}
            <button
              onClick={() => setSelectedOnboardingId(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <ArrowRight size={16} className="rotate-180" />
              Voltar para lista de clientes
            </button>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-4 space-y-6">
                <ResumoIAPanel
                  resumo={selectedOnboarding.resumoIA}
                  onSave={async (novo) => {
                    await atualizarResumo({ id: selectedOnboarding.id, resumo: novo });
                  }}
                />

                <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                  <Texto variant="label" className="mb-2">Status do Onboarding</Texto>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <Texto variant="corpo" className="font-bold">{selectedOnboarding.status}</Texto>
                  </div>
                </Card>
              </div>

              <div className="xl:col-span-8 overflow-hidden">
                <OnboardingKanban
                  onboardingId={selectedOnboarding.id}
                  tarefas={selectedOnboarding.tarefas}
                />
              </div>
            </div>
          </div>
        )
      ) : (
        /* Aba de Empresas */
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por Razão Social, CNPJ ou Cód..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-500"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPaginaAtual(1); }}
                  />
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  {['TODOS', 'SIMPLES', 'MEI', 'PRESUMIDO', 'REAL'].map((regime) => (
                    <button
                      key={regime}
                      onClick={() => { setFiltroRegime(regime); setPaginaAtual(1); }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        filtroRegime === regime 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {regime}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".csv,.xlsx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const success = await importarEmpresas(file);
                      if (success) toast.success('Importação concluída!');
                      else toast.error('Erro na importação.');
                    }
                  }}
                />
                <Botao variant="outline" className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet size={18} /> Importação Massiva
                </Botao>
                <Botao variant="primary" className="flex items-center gap-2 shadow-lg shadow-blue-500/20" onClick={() => { setEmpresaParaEdicao(null); setIsModalCadastroOpen(true); }}>
                  <Plus size={18} /> Nova Empresa
                </Botao>
              </div>
            </div>
            
            <TabelaGenerica
              colunas={colunasEmpresas}
              dados={empresasPaginadas}
              chaveUnica={(e) => e.id}
              isLoading={isLoadingEmpresas}
              vazio={{
                icone: <Building2 size={32} className="text-slate-400" />,
                titulo: "Nenhuma empresa cadastrada",
                subtitulo: "Inicie um cadastro manual ou importe via planilha."
              }}
              onClickLinha={(e) => setEmpresaDetalhes(e)}
            />

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Botao 
                  variant="outline" 
                  size="sm" 
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual(prev => prev - 1)}
                >
                  Anterior
                </Botao>
                <Texto variant="detalhe" className="opacity-60">
                  Página {paginaAtual} de {totalPaginas}
                </Texto>
                <Botao 
                  variant="outline" 
                  size="sm" 
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual(prev => prev + 1)}
                >
                  Próxima
                </Botao>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Lateral */}
      <TimelineLateral
        leadId={leadTimeline?.id ?? null}
        nomeContato={leadTimeline?.nomeContato ?? ''}
        aberta={timelineAberta}
        onFechar={() => setTimelineAberta(false)}
      />
      {/* Modal de Cadastro de Empresa */}
      <ModalCadastroEmpresa 
        isOpen={isModalCadastroOpen}
        onClose={() => {
          setIsModalCadastroOpen(false);
          setEmpresaParaEdicao(null);
        }}
        initialData={empresaParaEdicao}
        onSave={async (nova) => {
          let success;
          if (empresaParaEdicao?.id) {
            success = await atualizarEmpresa(empresaParaEdicao.id, nova);
          } else {
            success = await criarEmpresa(nova);
          }
          
          if (success) {
            toast.success(empresaParaEdicao ? 'Empresa atualizada!' : 'Empresa cadastrada!');
            setIsModalCadastroOpen(false);
            setEmpresaParaEdicao(null);
            setEmpresaDetalhes(null); // Fechar detalhes se estava aberto
          } else {
            toast.error('Erro ao salvar empresa.');
          }
        }}
      />

      {/* Painel Lateral de Detalhes da Empresa */}
      <AnimatePresence>
        {empresaDetalhes && (
          <div className="fixed inset-0 z-[1500] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmpresaDetalhes(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-slate-900 border-l border-white/10 h-full shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Header Detalhes */}
              <div className="p-8 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <Building2 size={32} />
                  </div>
                  <button 
                    onClick={() => setEmpresaDetalhes(null)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <Texto variant="subtitulo" className="text-2xl mb-2">{empresaDetalhes.razaoSocial}</Texto>
                <div className="flex flex-wrap gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getRegimeColor(empresaDetalhes.regimeTributario)}`}>
                    {empresaDetalhes.regimeTributario}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10">
                    {empresaDetalhes.identificadorInterno}
                  </span>
                </div>
              </div>

              {/* Conteúdo Detalhes */}
              <div className="flex-1 p-8 space-y-8">
                {/* Info Geral */}
                <section>
                  <Texto variant="label" className="mb-4 text-blue-500">Informações Gerais</Texto>
                  <Card variant="flat" className="p-6 space-y-4 border-white/5 bg-white/[0.02]">
                    <div>
                      <Texto variant="detalhe" className="opacity-50">Nome Fantasia</Texto>
                      <Texto variant="corpo" className="font-medium">{empresaDetalhes.nomeFantasia || '-'}</Texto>
                    </div>
                    <div>
                      <Texto variant="detalhe" className="opacity-50">CNPJ / CPF</Texto>
                      <Texto variant="corpo" className="font-mono text-lg">{empresaDetalhes.identificacao}</Texto>
                    </div>
                  </Card>
                </section>

                {/* Contatos */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-blue-500" />
                    <Texto variant="label" className="text-blue-500 uppercase tracking-wider">Contatos ({empresaDetalhes.contatos?.length || 0})</Texto>
                  </div>
                  <div className="space-y-4">
                    {empresaDetalhes.contatos?.map((c) => (
                      <Card key={c.id} variant="flat" className="p-5 border-white/5 hover:border-blue-500/20 transition-all bg-white/[0.02] group">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <Texto variant="corpo" className="font-bold">{c.nome}</Texto>
                            <div className="flex items-center gap-2 opacity-60">
                              <Briefcase size={12} />
                              <Texto variant="detalhe">{c.cargo} • {c.departamento}</Texto>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-14">
                          <div className="flex items-center gap-3 text-slate-400">
                            <Phone size={14} />
                            <Texto variant="detalhe">{c.celular}</Texto>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400">
                            <Mail size={14} />
                            <Texto variant="detalhe">{c.email}</Texto>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {(!empresaDetalhes.contatos || empresaDetalhes.contatos.length === 0) && (
                      <Texto variant="detalhe" className="text-center py-4 opacity-40">Nenhum contato cadastrado.</Texto>
                    )}
                  </div>
                </section>

                {/* Endereços */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={18} className="text-blue-500" />
                    <Texto variant="label" className="text-blue-500 uppercase tracking-wider">Endereços ({empresaDetalhes.enderecos?.length || 0})</Texto>
                  </div>
                  <div className="space-y-4">
                    {empresaDetalhes.enderecos?.map((end) => (
                      <Card key={end.id} variant="flat" className="p-5 border-white/5 bg-white/[0.02]">
                        <Texto variant="corpo" className="font-medium mb-1">
                          {end.logradouro}, {end.numero}
                        </Texto>
                        <Texto variant="detalhe" className="opacity-60 mb-3">
                          {end.bairro} • {end.cidade}/{end.uf} • CEP: {end.cep}
                        </Texto>
                        <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-4">
                          <div>
                            <Texto variant="detalhe" className="opacity-40">Insc. Estadual</Texto>
                            <Texto variant="detalhe">{end.inscricaoEstadual || (end.isentoIcms ? 'Isento' : '-')}</Texto>
                          </div>
                          <div>
                            <Texto variant="detalhe" className="opacity-40">Insc. Municipal</Texto>
                            <Texto variant="detalhe">{end.inscricaoMunicipal || '-'}</Texto>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {(!empresaDetalhes.enderecos || empresaDetalhes.enderecos.length === 0) && (
                      <Texto variant="detalhe" className="text-center py-4 opacity-40">Nenhum endereço cadastrado.</Texto>
                    )}
                  </div>
                </section>
              </div>

              {/* Footer Detalhes */}
              <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
                <Botao className="flex-1" onClick={() => {
                  setEmpresaParaEdicao(empresaDetalhes);
                  setIsModalCadastroOpen(true);
                }}>
                  Editar Empresa
                </Botao>
                <Botao variant="outline" onClick={() => setEmpresaDetalhes(null)}>Fechar</Botao>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
