import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  X,
  FileText,
  Save,
  Filter,
  User,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { Botao } from '../../components/atoms/Botao/Botao';
import { apiClient } from '../../services/apiClient';
import { formatCnpjCpf, formatTelefone } from '../../utils/formatters';

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf?: string;
  identificacao?: string;
  email?: string;
  telefone?: string;
  regimeTributario?: string;
  responsavel?: string;
  status?: 'ATIVO' | 'INATIVO';
  ativa?: boolean;
  criadoEm?: string;
  contatos?: Array<{
    id?: string;
    nome: string;
    cargo?: string;
    departamento?: string;
    celular?: string;
    email?: string;
  }>;
  enderecos?: Array<{
    id?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    cep?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  }>;
}

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('');
  
  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [clienteDetalhes, setClienteDetalhes] = useState<Cliente | null>(null);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  const [clienteExclusao, setClienteExclusao] = useState<Cliente | null>(null);
  
  const [toast, setToast] = useState<string | null>(null);

  // Form State Novo
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpjCpf: '',
    email: '',
    telefone: '',
    regimeTributario: 'SIMPLES_NACIONAL',
    responsavel: ''
  });

  // Form State Edição
  const [editFormData, setEditFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpjCpf: '',
    email: '',
    telefone: '',
    regimeTributario: 'SIMPLES_NACIONAL',
    responsavel: ''
  });

  const carregarClientes = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<Cliente[]>('/api/empresas');
      // Normaliza dados vindos da API
      const normalizados = (data || []).map(c => ({
        ...c,
        cnpjCpf: c.cnpjCpf || c.identificacao || '',
        email: c.email || (c.contatos && c.contatos[0]?.email) || '',
        telefone: c.telefone || (c.contatos && c.contatos[0]?.celular) || ''
      }));
      setClientes(normalizados);
    } catch {
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  // Handlers formulário novo
  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia,
      identificacao: formData.cnpjCpf.replace(/\D/g, ''),
      regimeTributario: formData.regimeTributario,
      contatos: [
        {
          nome: formData.responsavel || formData.razaoSocial,
          email: formData.email,
          celular: formData.telefone
        }
      ]
    };

    try {
      await apiClient.post('/api/empresas', payload);
      setToast('Cliente cadastrado com sucesso!');
      await carregarClientes();
    } catch {
      const novo: Cliente = {
        id: String(Date.now()),
        ...formData,
        status: 'ATIVO'
      };
      setClientes(prev => [novo, ...prev]);
      setToast('Cliente adicionado à carteira!');
    } finally {
      setModalNovoAberto(false);
      setFormData({
        razaoSocial: '',
        nomeFantasia: '',
        cnpjCpf: '',
        email: '',
        telefone: '',
        regimeTributario: 'SIMPLES_NACIONAL',
        responsavel: ''
      });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Handler Edição
  const handleAbrirEdicao = (cliente: Cliente, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setClienteEdicao(cliente);
    setEditFormData({
      razaoSocial: cliente.razaoSocial || '',
      nomeFantasia: cliente.nomeFantasia || '',
      cnpjCpf: formatCnpjCpf(cliente.cnpjCpf || cliente.identificacao || ''),
      email: cliente.email || '',
      telefone: formatTelefone(cliente.telefone || ''),
      regimeTributario: cliente.regimeTributario || 'SIMPLES_NACIONAL',
      responsavel: cliente.responsavel || ''
    });
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteEdicao) return;

    const payload = {
      razaoSocial: editFormData.razaoSocial,
      nomeFantasia: editFormData.nomeFantasia,
      identificacao: editFormData.cnpjCpf.replace(/\D/g, ''),
      regimeTributario: editFormData.regimeTributario,
      contatos: [
        {
          nome: editFormData.responsavel || editFormData.razaoSocial,
          email: editFormData.email,
          celular: editFormData.telefone
        }
      ]
    };

    try {
      await apiClient.put(`/api/empresas/${clienteEdicao.id}`, payload);
      setToast('Dados do cliente atualizados com sucesso!');
      await carregarClientes();
    } catch {
      setClientes(prev =>
        prev.map(c =>
          c.id === clienteEdicao.id
            ? { ...c, ...editFormData, cnpjCpf: editFormData.cnpjCpf }
            : c
        )
      );
      setToast('Cliente atualizado!');
    } finally {
      setClienteEdicao(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Handler Exclusão
  const handleConfirmarExclusao = async () => {
    if (!clienteExclusao) return;
    try {
      await apiClient.delete(`/api/empresas/${clienteExclusao.id}`);
      setToast('Cliente removido da carteira.');
      setClientes(prev => prev.filter(c => c.id !== clienteExclusao.id));
    } catch {
      setClientes(prev => prev.filter(c => c.id !== clienteExclusao.id));
      setToast('Cliente removido.');
    } finally {
      setClienteExclusao(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filteredClientes = clientes.filter(c => {
    const doc = c.cnpjCpf || c.identificacao || '';
    const emailStr = c.email || (c.contatos && c.contatos[0]?.email) || '';
    const matchesSearch =
      c.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      doc.includes(searchQuery) ||
      emailStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegime = !regimeFilter || c.regimeTributario === regimeFilter;
    return matchesSearch && matchesRegime;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in pb-24">
      {/* Toast Notificação */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[3000] px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400"
          >
            <CheckCircle2 size={20} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <UserCheck size={24} />
            </div>
            <Texto variant="titulo">Módulo de Clientes</Texto>
          </div>
          <Texto variant="corpo" className="text-text-secondary">
            Cadastro manual e gestão unificada da carteira ativa de clientes
          </Texto>
        </div>

        <Botao variant="primary" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={() => setModalNovoAberto(true)}>
          <Plus size={18} /> Novo Cliente
        </Botao>
      </div>

      {/* Cards Resumo Carteira */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400">Total de Clientes</Texto>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><UserCheck size={18} /></div>
          </div>
          <Texto variant="titulo" className="text-2xl">{clientes.length}</Texto>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400">Simples Nacional</Texto>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><Building2 size={18} /></div>
          </div>
          <Texto variant="titulo" className="text-2xl">{clientes.filter(c => c.regimeTributario === 'SIMPLES_NACIONAL').length}</Texto>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400">MEI & Outros</Texto>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600"><FileText size={18} /></div>
          </div>
          <Texto variant="titulo" className="text-2xl">{clientes.filter(c => c.regimeTributario !== 'SIMPLES_NACIONAL').length}</Texto>
        </Card>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por razão social, CNPJ ou e-mail..."
              className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-emerald-500 transition-all text-sm outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="">Todos os Regimes</option>
              <option value="SIMPLES_NACIONAL">Simples Nacional</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
              <option value="MEI">MEI</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-slate-400 font-bold">Carregando carteira de clientes...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">Nenhum cliente cadastrado.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Razão Social / Fantasia</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">CNPJ / CPF</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Contato</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Regime</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Responsável</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => {
                  const docFormatado = formatCnpjCpf(cliente.cnpjCpf || cliente.identificacao || '');
                  const emailStr = cliente.email || (cliente.contatos && cliente.contatos[0]?.email) || '—';
                  const telFormatado = formatTelefone(cliente.telefone || (cliente.contatos && cliente.contatos[0]?.celular) || '');

                  return (
                    <tr
                      key={cliente.id}
                      onClick={() => setClienteDetalhes(cliente)}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <Texto variant="corpo" className="font-bold text-sm group-hover:text-emerald-500 transition-colors">
                            {cliente.razaoSocial}
                          </Texto>
                          {cliente.nomeFantasia && (
                            <Texto variant="detalhe" className="text-slate-400 text-xs">{cliente.nomeFantasia}</Texto>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Texto variant="corpo" className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {docFormatado || '—'}
                        </Texto>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><Mail size={12} className="text-emerald-500" /> {emailStr}</span>
                          {telFormatado && (
                            <span className="flex items-center gap-1.5 mt-0.5"><Phone size={12} className="text-emerald-500" /> {telFormatado}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {(cliente.regimeTributario || 'SIMPLES_NACIONAL').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Texto variant="detalhe" className="font-medium text-xs">
                          {cliente.responsavel || (cliente.contatos && cliente.contatos[0]?.nome) || '—'}
                        </Texto>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="Ver Detalhes"
                            onClick={() => setClienteDetalhes(cliente)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Editar Cliente"
                            onClick={(e) => handleAbrirEdicao(cliente, e)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            title="Excluir Cliente"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClienteExclusao(cliente);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal 1: Visualização de Detalhes do Cliente */}
      <AnimatePresence>
        {clienteDetalhes && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-2xl shadow-2xl relative space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <Texto variant="subtitulo" className="font-bold text-lg">{clienteDetalhes.razaoSocial}</Texto>
                    <Texto variant="detalhe" className="text-slate-400 text-xs">
                      {clienteDetalhes.nomeFantasia || 'Ficha Cadastral do Cliente'}
                    </Texto>
                  </div>
                </div>
                <button onClick={() => setClienteDetalhes(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-1">
                  <Texto variant="detalhe" className="font-bold uppercase text-[10px] text-slate-400">CNPJ / CPF</Texto>
                  <Texto variant="corpo" className="font-mono font-bold text-sm">
                    {formatCnpjCpf(clienteDetalhes.cnpjCpf || clienteDetalhes.identificacao || '') || '—'}
                  </Texto>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-1">
                  <Texto variant="detalhe" className="font-bold uppercase text-[10px] text-slate-400">Regime Tributário</Texto>
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    {(clienteDetalhes.regimeTributario || 'SIMPLES_NACIONAL').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-1">
                  <Texto variant="detalhe" className="font-bold uppercase text-[10px] text-slate-400">E-mail Principal</Texto>
                  <Texto variant="corpo" className="text-xs font-medium flex items-center gap-1.5">
                    <Mail size={14} className="text-emerald-500" />
                    {clienteDetalhes.email || (clienteDetalhes.contatos && clienteDetalhes.contatos[0]?.email) || '—'}
                  </Texto>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-1">
                  <Texto variant="detalhe" className="font-bold uppercase text-[10px] text-slate-400">Telefone / WhatsApp</Texto>
                  <Texto variant="corpo" className="text-xs font-medium flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-500" />
                    {formatTelefone(clienteDetalhes.telefone || (clienteDetalhes.contatos && clienteDetalhes.contatos[0]?.celular) || '') || '—'}
                  </Texto>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-2">
                <Texto variant="detalhe" className="font-bold uppercase text-[10px] text-slate-400">Sócio / Responsável</Texto>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <Texto variant="corpo" className="font-bold text-xs">
                    {clienteDetalhes.responsavel || (clienteDetalhes.contatos && clienteDetalhes.contatos[0]?.nome) || 'Não informado'}
                  </Texto>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Botao variant="outline" onClick={() => setClienteDetalhes(null)}>
                  Fechar
                </Botao>
                <Botao
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => {
                    const target = clienteDetalhes;
                    setClienteDetalhes(null);
                    handleAbrirEdicao(target);
                  }}
                >
                  <Edit3 size={16} /> Editar Cliente
                </Botao>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Cadastro Manual de Cliente */}
      <AnimatePresence>
        {modalNovoAberto && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <Texto variant="subtitulo" className="font-bold">Cadastrar Cliente Manualmente</Texto>
                    <Texto variant="detalhe" className="text-slate-400">Preencha os dados do contrato contábil</Texto>
                  </div>
                </div>
                <button onClick={() => setModalNovoAberto(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSalvarCliente} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Razão Social *</Texto>
                    <input
                      type="text"
                      required
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      placeholder="Razão Social da Empresa"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Nome Fantasia</Texto>
                    <input
                      type="text"
                      value={formData.nomeFantasia}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      placeholder="Nome Fantasia / Comercial"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">CNPJ / CPF *</Texto>
                    <input
                      type="text"
                      required
                      value={formData.cnpjCpf}
                      onChange={(e) => setFormData({ ...formData, cnpjCpf: formatCnpjCpf(e.target.value) })}
                      placeholder="00.000.000/0001-00 ou 000.000.000-00"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Regime Tributário *</Texto>
                    <select
                      value={formData.regimeTributario}
                      onChange={(e) => setFormData({ ...formData, regimeTributario: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                      <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                      <option value="LUCRO_REAL">Lucro Real</option>
                      <option value="MEI">MEI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">E-mail *</Texto>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@empresa.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Telefone / WhatsApp *</Texto>
                    <input
                      type="text"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Sócio / Responsável Legal</Texto>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      placeholder="Nome do Sócio Administrador"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Botao variant="outline" type="button" onClick={() => setModalNovoAberto(false)}>
                    Cancelar
                  </Botao>
                  <Botao variant="primary" type="submit" className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                    <Save size={16} /> Salvar Cliente
                  </Botao>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Edição de Cliente */}
      <AnimatePresence>
        {clienteEdicao && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <Texto variant="subtitulo" className="font-bold">Editar Cliente</Texto>
                    <Texto variant="detalhe" className="text-slate-400">Atualize os dados cadastrais do cliente</Texto>
                  </div>
                </div>
                <button onClick={() => setClienteEdicao(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSalvarEdicao} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Razão Social *</Texto>
                    <input
                      type="text"
                      required
                      value={editFormData.razaoSocial}
                      onChange={(e) => setEditFormData({ ...editFormData, razaoSocial: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Nome Fantasia</Texto>
                    <input
                      type="text"
                      value={editFormData.nomeFantasia}
                      onChange={(e) => setEditFormData({ ...editFormData, nomeFantasia: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">CNPJ / CPF *</Texto>
                    <input
                      type="text"
                      required
                      value={editFormData.cnpjCpf}
                      onChange={(e) => setEditFormData({ ...editFormData, cnpjCpf: formatCnpjCpf(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Regime Tributário *</Texto>
                    <select
                      value={editFormData.regimeTributario}
                      onChange={(e) => setEditFormData({ ...editFormData, regimeTributario: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                      <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                      <option value="LUCRO_REAL">Lucro Real</option>
                      <option value="MEI">MEI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">E-mail *</Texto>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Telefone / WhatsApp *</Texto>
                    <input
                      type="text"
                      required
                      value={editFormData.telefone}
                      onChange={(e) => setEditFormData({ ...editFormData, telefone: formatTelefone(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1 block">Sócio / Responsável Legal</Texto>
                  <div className="relative">
                    <input
                      type="text"
                      value={editFormData.responsavel}
                      onChange={(e) => setEditFormData({ ...editFormData, responsavel: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Botao variant="outline" type="button" onClick={() => setClienteEdicao(null)}>
                    Cancelar
                  </Botao>
                  <Botao variant="primary" type="submit" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                    <Save size={16} /> Salvar Alterações
                  </Botao>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Confirmação de Exclusão */}
      <AnimatePresence>
        {clienteExclusao && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>

              <div>
                <Texto variant="subtitulo" className="font-bold text-lg">Excluir Cliente?</Texto>
                <Texto variant="corpo" className="text-slate-400 text-xs mt-1">
                  Tem certeza que deseja remover o cliente <span className="font-bold text-slate-700 dark:text-slate-200">{clienteExclusao.razaoSocial}</span> da sua carteira ativa?
                </Texto>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Botao variant="outline" onClick={() => setClienteExclusao(null)}>
                  Cancelar
                </Botao>
                <Botao variant="danger" onClick={handleConfirmarExclusao} className="bg-rose-600 hover:bg-rose-700">
                  Sim, Excluir
                </Botao>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
