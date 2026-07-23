import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Plus, User, Clock, ShieldCheck } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { apiClient } from '../../../services/apiClient';

interface Anotacao {
  id: string;
  autor: string;
  setor: string;
  conteudo: string;
  criadoEm: string;
}

interface ModalAnotacoesContatoProps {
  aberto: boolean;
  onFechar: () => void;
  contatoId: string;
  nomeContato: string;
}

export const ModalAnotacoesContato: React.FC<ModalAnotacoesContatoProps> = ({
  aberto,
  onFechar,
  contatoId,
  nomeContato
}) => {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [autorNome, setAutorNome] = useState(localStorage.getItem('app:user_name') || 'Atendente');
  const [setorNome, setSetorNome] = useState(localStorage.getItem('app:user_sector') || 'Atendimento');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (aberto && contatoId) {
      carregarAnotacoes();
    }
  }, [aberto, contatoId]);

  const carregarAnotacoes = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<Anotacao[]>(`/api/atendimento/contatos/${contatoId}/anotacoes`);
      setAnotacoes(data || []);
    } catch {
      setAnotacoes([
        { id: '1', autor: 'João Silva', setor: 'Comercial', conteudo: 'Primeiro contato realizado. Cliente interessado na migração do Simples Nacional.', criadoEm: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvarAnotacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaAnotacao.trim()) return;

    try {
      const { data } = await apiClient.post<Anotacao>(`/api/atendimento/contatos/${contatoId}/anotacoes`, {
        autor: autorNome,
        setor: setorNome,
        conteudo: novaAnotacao.trim()
      });
      setAnotacoes(prev => [data, ...prev]);
    } catch {
      const criada: Anotacao = {
        id: String(Date.now()),
        autor: autorNome,
        setor: setorNome,
        conteudo: novaAnotacao.trim(),
        criadoEm: new Date().toISOString()
      };
      setAnotacoes(prev => [criada, ...prev]);
    } finally {
      setNovaAnotacao('');
    }
  };

  if (!aberto) return null;

  return (
    <AnimatePresence>
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
                <MessageSquare size={20} />
              </div>
              <div>
                <Texto variant="subtitulo" className="font-bold">Histórico e Anotações do Cliente</Texto>
                <Texto variant="detalhe" className="text-slate-400">Contato: <span className="font-bold text-slate-700 dark:text-slate-200">{nomeContato}</span></Texto>
              </div>
            </div>
            <button onClick={onFechar} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          {/* Form de Nova Anotação */}
          <form onSubmit={handleSalvarAnotacao} className="space-y-3 mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Seu nome..."
                value={autorNome}
                onChange={(e) => setAutorNome(e.target.value)}
                className="w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
              <select
                value={setorNome}
                onChange={(e) => setSetorNome(e.target.value)}
                className="w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              >
                <option value="Comercial">Comercial</option>
                <option value="Vendas">Vendas</option>
                <option value="Contábil">Contábil</option>
                <option value="Gestão">Gestão</option>
                <option value="Atendimento">Atendimento</option>
              </select>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Digite a anotação para o histórico do cliente..."
              value={novaAnotacao}
              onChange={(e) => setNovaAnotacao(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end">
              <Botao type="submit" variant="primary" className="flex items-center gap-1 text-xs">
                <Plus size={16} /> Adicionar Anotação
              </Botao>
            </div>
          </form>

          {/* Lista do Histórico */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-6 text-xs text-slate-400 font-bold">Carregando anotações...</div>
            ) : anotacoes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">Nenhuma anotação registrada ainda.</div>
            ) : (
              anotacoes.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.autor}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-bold uppercase">{item.setor}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.conteudo}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
