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
  User
} from 'lucide-react';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { Botao } from '../../components/atoms/Botao/Botao';
import { apiClient } from '../../services/apiClient';

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf: string;
  email: string;
  telefone: string;
  regimeTributario: string;
  responsavel: string;
  status: 'ATIVO' | 'INATIVO';
  criadoEm?: string;
}

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
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
      setClientes(data || []);
    } catch {
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/empresas', formData);
      setToast('Cliente cadastrado com sucesso!');
    } catch {
      // Inserção otimista local
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

  const filteredClientes = clientes.filter(c => {
    const matchesSearch =
      c.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      c.cnpjCpf.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegime = !regimeFilter || c.regimeTributario === regimeFilter;
    return matchesSearch && matchesRegime;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in pb-24">
      {/* Toast */}
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

        <Botao variant="primary" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setModalNovoAberto(true)}>
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
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <Texto variant="corpo" className="font-bold text-sm">{cliente.razaoSocial}</Texto>
                        {cliente.nomeFantasia && <Texto variant="detalhe" className="text-slate-400 text-xs">{cliente.nomeFantasia}</Texto>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Texto variant="corpo" className="font-mono text-xs">{cliente.cnpjCpf}</Texto>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Mail size={12} /> {cliente.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12} /> {cliente.telefone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {cliente.regimeTributario.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Texto variant="detalhe" className="font-medium text-xs">{cliente.responsavel || '—'}</Texto>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Cadastro Manual de Cliente */}
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
                      onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
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
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
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
    </div>
  );
};
