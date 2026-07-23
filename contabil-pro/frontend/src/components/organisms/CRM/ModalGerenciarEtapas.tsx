import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Check, LayoutGrid } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { useEtapasFunil, type EtapaFunil } from '../../../hooks/useEtapasFunil';

interface ModalGerenciarEtapasProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ModalGerenciarEtapas: React.FC<ModalGerenciarEtapasProps> = ({ aberto, onFechar }) => {
  const { etapas, salvarEtapa, removerEtapa, isSalvando } = useEtapasFunil();
  const [novaEtapa, setNovaEtapa] = useState({ nome: '', cor: '#3b82f6' });
  const [etapaEditando, setEtapaEditando] = useState<EtapaFunil | null>(null);

  if (!aberto) return null;

  const handleSalvarNova = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEtapa.nome.trim()) return;

    const chave = novaEtapa.nome.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    await salvarEtapa({
      chave,
      nome: novaEtapa.nome.trim(),
      ordem: etapas.length + 1,
      cor: novaEtapa.cor,
    });

    setNovaEtapa({ nome: '', cor: '#3b82f6' });
  };

  const handleSalvarEdicao = async () => {
    if (!etapaEditando) return;
    await salvarEtapa(etapaEditando);
    setEtapaEditando(null);
  };

  const handleExcluir = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Tem certeza que deseja excluir esta etapa do funil?')) {
      await removerEtapa(id);
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
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                <LayoutGrid size={20} />
              </div>
              <div>
                <Texto variant="subtitulo" className="font-bold">Gerenciar Etapas do Funil</Texto>
                <Texto variant="detalhe" className="text-slate-400">Personalize o funil de vendas do seu escritório</Texto>
              </div>
            </div>
            <button onClick={onFechar} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          {/* Form para Adicionar Nova Etapa */}
          <form onSubmit={handleSalvarNova} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Nome da nova etapa..."
              value={novaEtapa.nome}
              onChange={(e) => setNovaEtapa(prev => ({ ...prev, nome: e.target.value }))}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="color"
              value={novaEtapa.cor}
              onChange={(e) => setNovaEtapa(prev => ({ ...prev, cor: e.target.value }))}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-1 bg-slate-50 dark:bg-slate-800"
              title="Cor da etapa"
            />
            <Botao type="submit" variant="primary" disabled={isSalvando} className="flex items-center gap-1 text-xs">
              <Plus size={16} /> Adicionar
            </Botao>
          </form>

          {/* Lista de Etapas */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {etapas.map((etapa, idx) => (
              <div
                key={etapa.id || idx}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
              >
                {etapaEditando?.id === etapa.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={etapaEditando?.nome}
                      onChange={(e) => setEtapaEditando({ ...etapaEditando!, nome: e.target.value })}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-xs outline-none"
                    />
                    <input
                      type="color"
                      value={etapaEditando?.cor || '#3b82f6'}
                      onChange={(e) => setEtapaEditando({ ...etapaEditando!, cor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                    />
                    <button onClick={handleSalvarEdicao} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: etapa.cor || '#3b82f6' }} />
                    <Texto variant="corpo" className="text-xs font-bold">{etapa.nome}</Texto>
                    <span className="text-[10px] text-slate-400 font-mono">({etapa.chave})</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEtapaEditando(etapa)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Edit2 size={14} />
                  </button>
                  {etapa.id && (
                    <button
                      onClick={() => handleExcluir(etapa.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
