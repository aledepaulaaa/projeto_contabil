import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Upload, Check, User, Mail } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { useLeads } from '../../../hooks/useLeads';
import { apiClient } from '../../../services/apiClient';

interface ModalNovoContratoProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

export const ModalNovoContrato: React.FC<ModalNovoContratoProps> = ({ aberto, onFechar, onSucesso }) => {
  const { leads } = useLeads();
  const [leadIdSelecionado, setLeadIdSelecionado] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [modeloArquivo, setModeloArquivo] = useState<File | null>(null);
  const [isGerando, setIsGerando] = useState(false);

  if (!aberto) return null;

  const handleSelectLead = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setLeadIdSelecionado(id);
    const selected = leads?.find(l => l.id === id);
    if (selected) {
      setNomeContato(selected.nomeContato || selected.nomeEmpresa || '');
      setEmailContato(selected.email || '');
    }
  };

  const handleGerarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeContato || !emailContato) return;

    setIsGerando(true);
    try {
      await apiClient.post('/api/contratos/novo', {
        leadId: leadIdSelecionado,
        nomeContato,
        emailContato,
        nomeModelo: modeloArquivo?.name || 'MODELO_PADRAO.docx'
      });
      onSucesso();
      onFechar();
    } catch (err) {
      console.error('Erro ao criar novo contrato:', err);
    } finally {
      setIsGerando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 text-violet-600 rounded-xl">
                <FileText size={20} />
              </div>
              <div>
                <Texto variant="subtitulo" className="font-bold">Gerar Novo Contrato</Texto>
                <Texto variant="detalhe" className="text-slate-400">Assinatura digital automatizada via ZapSign</Texto>
              </div>
            </div>
            <button onClick={onFechar} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleGerarContrato} className="space-y-4">
            <div>
              <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Selecionar Cliente / Lead (Opcional)
              </Texto>
              <select
                value={leadIdSelecionado}
                onChange={handleSelectLead}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Seleção manual ou escolha um Lead --</option>
                {leads?.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nomeContato} {l.nomeEmpresa ? `(${l.nomeEmpresa})` : ''} - {l.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Nome do Contato / Empresa *
              </Texto>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                  placeholder="Nome completo do signatário"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500"
                />
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                E-mail para Assinatura *
              </Texto>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  placeholder="email@cliente.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Upload / Seleção de Modelo de Contrato */}
            <div>
              <Texto variant="detalhe" className="font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Modelo de Contrato (.docx / .pdf)
              </Texto>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-violet-500/50 bg-slate-50/50 dark:bg-slate-800/40 transition-all">
                <Upload size={24} className="text-violet-500 mb-1" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {modeloArquivo ? modeloArquivo.name : 'Clique para selecionar o modelo de contrato'}
                </span>
                <span className="text-[10px] text-slate-400">Variáveis dinâmicas (Nome, CNPJ, Valor) serão preenchidas automaticamente</span>
                <input
                  type="file"
                  accept=".docx,.pdf"
                  onChange={(e) => setModeloArquivo(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Botao variant="outline" type="button" onClick={onFechar}>
                Cancelar
              </Botao>
              <Botao variant="primary" type="submit" disabled={isGerando} className="bg-violet-600 hover:bg-violet-700 flex items-center gap-2">
                <Check size={16} /> {isGerando ? 'Gerando...' : 'Gerar e Enviar via ZapSign'}
              </Botao>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
