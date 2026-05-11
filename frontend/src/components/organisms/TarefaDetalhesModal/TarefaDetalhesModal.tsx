import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Calendar, 
  AlignLeft, 
  CheckSquare, 
  Flag,
  Plus,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import type { TarefaOnboarding, PrioridadeTarefa } from '../../../services/OnboardingService';

interface TarefaDetalhesModalProps {
  tarefa: TarefaOnboarding | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (tarefa: Partial<TarefaOnboarding>) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
}

export const TarefaDetalhesModal: React.FC<TarefaDetalhesModalProps> = ({ 
  tarefa, 
  aberto, 
  onFechar, 
  onSalvar, 
  onExcluir 
}) => {
  const [editando, setEditando] = useState<Partial<TarefaOnboarding>>({});
  const [novoItemChecklist, setNovoItemChecklist] = useState('');

  useEffect(() => {
    if (tarefa) {
      setEditando({ ...tarefa });
    }
  }, [tarefa]);

  if (!tarefa) return null;

  const prioridades: { value: PrioridadeTarefa; label: string; color: string; bg: string }[] = [
    { value: 'BAIXA', label: 'Baixa', color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { value: 'MEDIA', label: 'Média', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { value: 'ALTA', label: 'Alta', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { value: 'URGENTE', label: 'Urgente', color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const handleSalvar = async () => {
    await onSalvar(editando);
    onFechar();
  };

  const alternarChecklist = (id: string) => {
    const novosItens = editando.checklist?.map(item => 
      item.id === id ? { ...item, concluido: !item.concluido } : item
    ) || [];
    setEditando({ ...editando, checklist: novosItens });
  };

  const adicionarItem = () => {
    if (!novoItemChecklist.trim()) return;
    const novosItens = [
      ...(editando.checklist || []),
      { id: crypto.randomUUID(), texto: novoItemChecklist, concluido: false }
    ];
    setEditando({ ...editando, checklist: novosItens });
    setNovoItemChecklist('');
  };

  const removerItem = (id: string) => {
    const novosItens = editando.checklist?.filter(item => item.id !== id) || [];
    setEditando({ ...editando, checklist: novosItens });
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-text-main placeholder:text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5 flex items-center gap-2";

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onFechar} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-2xl h-auto max-h-[90vh] overflow-hidden pointer-events-auto bg-primary-bg border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl relative flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex-1 mr-4">
                   <input 
                      value={editando.titulo || ''} 
                      onChange={e => setEditando({...editando, titulo: e.target.value})}
                      className="w-full bg-transparent border-none text-xl font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-1 -ml-1"
                   />
                   <Texto variant="detalhe" className="mt-1 opacity-60">Em {editando.status?.replace('_', ' ')}</Texto>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onExcluir(tarefa.id)} 
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Excluir Tarefa"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button onClick={onFechar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-text-secondary">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Prioridade e Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div>
                        <label className={labelClass}><Flag size={12} /> Prioridade</label>
                        <div className="flex flex-wrap gap-2">
                          {prioridades.map(p => (
                            <button
                              key={p.value}
                              onClick={() => setEditando({...editando, prioridade: p.value})}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                editando.prioridade === p.value 
                                ? `${p.bg} ${p.color} border-current` 
                                : 'bg-slate-50 dark:bg-slate-900/50 border-transparent text-text-secondary opacity-50 hover:opacity-100'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}><Calendar size={12} /> Prazo de Entrega</label>
                        <input 
                          type="datetime-local" 
                          className={inputClass}
                          value={editando.dataFim?.substring(0, 16) || ''}
                          onChange={e => setEditando({...editando, dataFim: e.target.value})}
                        />
                      </div>
                   </div>

                   {/* Resumo ou Outros Metadados */}
                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                      <Texto variant="detalhe" className="font-bold opacity-40 uppercase tracking-widest text-[9px] mb-3">Status Rápido</Texto>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <Texto variant="detalhe">Checklist</Texto>
                            <Texto variant="detalhe" className="font-bold">
                               {editando.checklist?.filter(i => i.concluido).length}/{editando.checklist?.length || 0}
                            </Texto>
                         </div>
                         <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${((editando.checklist?.filter(i => i.concluido).length || 0) / (editando.checklist?.length || 1)) * 100}%` }}
                               className="h-full bg-blue-500"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Descrição */}
                <div className="space-y-3">
                  <label className={labelClass}><AlignLeft size={12} /> Descrição</label>
                  <textarea 
                    className={inputClass + " min-h-[120px] resize-none"} 
                    placeholder="Descreva os detalhes desta tarefa..."
                    value={editando.descricao || ''}
                    onChange={e => setEditando({...editando, descricao: e.target.value})}
                  />
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  <label className={labelClass}><CheckSquare size={12} /> Checklist</label>
                  <div className="space-y-2">
                    {editando.checklist?.map(item => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <button 
                          onClick={() => alternarChecklist(item.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            item.concluido 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {item.concluido && <CheckCircle2 size={12} />}
                        </button>
                        <input 
                          className={`flex-1 bg-transparent border-none text-sm transition-all focus:outline-none ${
                            item.concluido ? 'line-through opacity-40 text-text-secondary' : 'text-text-main'
                          }`}
                          value={item.texto}
                          onChange={e => {
                            const novosItens = editando.checklist?.map(i => i.id === item.id ? {...i, texto: e.target.value} : i);
                            setEditando({...editando, checklist: novosItens});
                          }}
                        />
                        <button 
                          onClick={() => removerItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-5 flex justify-center text-blue-500">
                        <Plus size={16} />
                      </div>
                      <input 
                        className="flex-1 bg-transparent border-none text-sm focus:outline-none placeholder:text-text-secondary opacity-60 focus:opacity-100 transition-opacity"
                        placeholder="Adicionar um item..."
                        value={novoItemChecklist}
                        onChange={e => setNovoItemChecklist(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && adicionarItem()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t border-slate-200 dark:border-white/10 gap-3">
                <Botao variant="outline" onClick={onFechar}>Cancelar</Botao>
                <Botao onClick={handleSalvar} className="flex items-center gap-2">
                  <Save size={16} />
                  Salvar Alterações
                </Botao>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
