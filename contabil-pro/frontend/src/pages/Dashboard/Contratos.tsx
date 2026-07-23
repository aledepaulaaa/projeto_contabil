import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Filter,
  RefreshCw,
  AlertCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { Botao } from '../../components/atoms/Botao/Botao';
import { useContratos } from '../../hooks/useContratos';
import { ModalNovoContrato } from '../../components/organisms/Contratos/ModalNovoContrato';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  GERANDO: {
    label: 'Gerando',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
    icon: <Loader2 size={14} className="animate-spin" />,
  },
  ERRO: {
    label: 'Erro',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700',
    icon: <AlertCircle size={14} />,
  },
  AGUARDANDO_ASSINATURA: {
    label: 'Aguardando Assinatura',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
    icon: <Clock size={14} />,
  },
  ATIVO: {
    label: 'Ativo',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700',
    icon: <CheckCircle2 size={14} />,
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700',
    icon: <XCircle size={14} />,
  },
  ARQUIVADO: {
    label: 'Arquivado',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700',
    icon: <Archive size={14} />,
  },
};

const MetricCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
  <motion.div whileHover={{ y: -3, scale: 1.01 }}>
    <Card className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400">
          {label}
        </Texto>
        <div className={`p-2 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
      <Texto variant="titulo" className="leading-none">{value}</Texto>
    </Card>
  </motion.div>
);

export const Contratos: React.FC = () => {
  const { 
    contratos, 
    isLoading, 
    ativarContrato, 
    cancelarContrato, 
    retentarContrato, 
    arquivarContrato,
    excluirContrato,
    refreshContratos, 
    isAtivando, 
    isCancelando, 
    isRetentando,
    isArquivando,
    isExcluindo
  } = useContratos();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: string; nome: string } | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [modalNovoContratoAberto, setModalNovoContratoAberto] = useState(false);

  const filteredContratos = contratos.filter(c => {
    const matchesSearch =
      (c.nomeContato?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (c.nomeEmpresa?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (c.emailContato?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const contarPorStatus = (status: string) => contratos.filter(c => c.status === status).length;

  const handleCancelar = async () => {
    if (cancelModal && motivoCancelamento.trim()) {
      await cancelarContrato(cancelModal.id, motivoCancelamento.trim());
      setCancelModal(null);
      setMotivoCancelamento('');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.GERANDO;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${config.bgColor} ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-10 space-y-10 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600">
              <FileSignature size={24} />
            </div>
            <Texto variant="titulo">Contratos</Texto>
          </div>
          <Texto variant="corpo" className="text-text-secondary">
            Gestão inteligente de contratos de prestação de serviços
          </Texto>
        </div>
        <div className="flex items-center gap-3">
          <Botao variant="primary" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => setModalNovoContratoAberto(true)}>
            <FileSignature size={16} /> Novo Contrato
          </Botao>
          <Botao variant="outline" className="flex items-center gap-2" onClick={refreshContratos}>
            <RefreshCw size={16} /> Atualizar
          </Botao>
        </div>
      </div>

      <ModalNovoContrato
        aberto={modalNovoContratoAberto}
        onFechar={() => setModalNovoContratoAberto(false)}
        onSucesso={() => refreshContratos()}
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total"
          value={contratos.length}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
          icon={<FileSignature size={18} />}
        />
        <MetricCard
          label="Aguardando"
          value={contarPorStatus('AGUARDANDO_ASSINATURA') + contarPorStatus('GERANDO')}
          color="bg-orange-100 dark:bg-orange-900/30 text-orange-600"
          icon={<Clock size={18} />}
        />
        <MetricCard
          label="Ativos"
          value={contarPorStatus('ATIVO')}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
          icon={<CheckCircle2 size={18} />}
        />
        <MetricCard
          label="Cancelados"
          value={contarPorStatus('CANCELADO')}
          color="bg-rose-100 dark:bg-rose-900/30 text-rose-600"
          icon={<XCircle size={18} />}
        />
      </div>

      {/* Tabela de Contratos */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou empresa..."
              className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-violet-500 transition-all text-sm outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400" />
            {['GERANDO', 'ERRO', 'AGUARDANDO_ASSINATURA', 'ATIVO', 'CANCELADO', 'ARQUIVADO'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(statusFilter === st ? null : st)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                  statusFilter === st
                    ? 'bg-violet-600 text-white border-violet-500 shadow'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                }`}
              >
                {statusConfig[st]?.label || st}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-violet-500" />
            </div>
          ) : filteredContratos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileSignature size={48} className="mb-4 opacity-30" />
              <Texto variant="corpo" className="font-bold">Nenhum contrato encontrado</Texto>
              <Texto variant="detalhe">Contratos serão gerados automaticamente ao mover leads para Fechamento</Texto>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Contato</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Empresa</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContratos.map((contrato, idx) => (
                  <motion.tr
                    key={contrato.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Texto variant="corpo" className="font-bold text-sm">{contrato.nomeContato || '—'}</Texto>
                        <Texto variant="detalhe" className="text-slate-400 text-xs">{contrato.emailContato || ''}</Texto>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Texto variant="corpo" className="text-sm">{contrato.nomeEmpresa || '—'}</Texto>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contrato.status} />
                      {contrato.motivoCancelamento && (
                        <Texto variant="detalhe" className="text-rose-400 mt-1 text-xs italic">
                          {contrato.motivoCancelamento}
                        </Texto>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Texto variant="detalhe" className="text-slate-500 text-xs">
                        {contrato.criadoEm ? new Date(contrato.criadoEm).toLocaleDateString('pt-BR') : '—'}
                      </Texto>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {contrato.urlDocumentoZapSign && (
                          <a
                            href={contrato.urlDocumentoZapSign}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-xl transition-colors text-violet-500"
                            title="Abrir Contrato"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        {contrato.status === 'ERRO' && (
                          <button
                            onClick={() => retentarContrato(contrato.id)}
                            disabled={isRetentando}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50"
                          >
                            <RefreshCw size={12} /> Tentar Novamente
                          </button>
                        )}
                        {contrato.status === 'AGUARDANDO_ASSINATURA' && (
                          <button
                            onClick={() => ativarContrato(contrato.id)}
                            disabled={isAtivando}
                            className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                          >
                            Ativar
                          </button>
                        )}
                        {contrato.status !== 'CANCELADO' && (
                          <button
                            onClick={() => setCancelModal({ id: contrato.id, nome: contrato.nomeContato || 'Contrato' })}
                            disabled={isCancelando}
                            className="px-3 py-1.5 bg-rose-500/10 text-rose-600 text-[10px] font-bold rounded-xl hover:bg-rose-500/20 transition-all disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        )}
                        {(contrato.status === 'ATIVO' || contrato.status === 'CANCELADO' || contrato.status === 'ERRO') && (
                          <button
                            onClick={() => arquivarContrato(contrato.id)}
                            disabled={isArquivando}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                            title="Arquivar"
                          >
                            <Archive size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir permanentemente este contrato?')) {
                              excluirContrato(contrato.id);
                            }
                          }}
                          disabled={isExcluindo}
                          className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-colors text-rose-500"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cancelamento */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelModal(null)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <Texto variant="corpo" className="font-bold">Cancelar Contrato</Texto>
              <Texto variant="detalhe" className="text-slate-500">
                Informe o motivo do cancelamento do contrato de <span className="font-bold text-rose-500">{cancelModal.nome}</span>.
              </Texto>
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Motivo do cancelamento..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Botao variant="outline" onClick={() => { setCancelModal(null); setMotivoCancelamento(''); }}>
                  Voltar
                </Botao>
                <Botao
                  variant="primary"
                  onClick={handleCancelar}
                  className={`bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 ${!motivoCancelamento.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!motivoCancelamento.trim()}
                >
                  Confirmar Cancelamento
                </Botao>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
