import React, { useState } from 'react';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Mail, 
  Building2, 
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  MapPin,
  SendHorizontal,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import type { LeadResponse } from '../../../hooks/useLeads';
import { etapas } from '../../../consts/crm';
import { ConfirmacaoModal } from '../../molecules/ConfirmacaoModal/ConfirmacaoModal';
import { Botao } from '../../atoms/Botao/Botao';

interface LeadTableProps {
  leads: LeadResponse[];
  isLoading: boolean;
  onView: (lead: LeadResponse) => void;
  onEdit: (lead: LeadResponse) => void;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, newStatus: string) => Promise<void>;
  onHistory: (lead: LeadResponse) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({ 
  leads, 
  isLoading, 
  onView, 
  onEdit, 
  onDelete,
  onMove,
  onHistory 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ id: string; status: string } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmMove = async (id: string) => {
    if (!pendingMove || pendingMove.id !== id) return;
    try {
      await onMove(id, pendingMove.status);
      setPendingMove(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <Building2 size={40} className="mx-auto text-slate-300 mb-4" />
        <Texto variant="corpo" className="font-semibold text-slate-500">Nenhum lead encontrado nesta busca</Texto>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto min-h-[400px]">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-slate-400 dark:text-slate-500">
            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Empresa / Contato</th>
            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Etapa do Funil</th>
            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Telefone</th>
            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Contato Principal</th>
            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-right">Gestão</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const isExpanded = expandedId === lead.id;
            const isPendingMove = pendingMove?.id === lead.id;
            
            return (
              <React.Fragment key={lead.id}>
                <tr className={`group transition-all ${isExpanded ? 'ring-2 ring-blue-500/20 z-10' : ''}`}>
                  <td className="bg-white dark:bg-slate-900/50 border-y border-l border-slate-200 dark:border-slate-800 first:rounded-l-xl p-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleExpand(lead.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} />}
                      </button>
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner">
                        {lead.nomeEmpresa?.[0] || lead.nomeContato?.[0] || 'L'}
                      </div>
                      <div>
                        <Texto variant="corpo" className="font-bold text-sm truncate max-w-[200px] text-slate-800 dark:text-slate-100">{lead.nomeEmpresa || lead.nomeContato}</Texto>
                        <Texto variant="detalhe" className="text-[10px] flex items-center gap-1 opacity-60 font-medium">
                          <Calendar size={10} />
                          {lead.criadoEm ? new Date(lead.criadoEm).toLocaleDateString('pt-BR') : 'Sem data'}
                        </Texto>
                      </div>
                    </div>
                  </td>
                  <td className="bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group/sel">
                         <select 
                          className={`appearance-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer min-w-[140px] pr-8 ${isPendingMove ? 'border-amber-400 dark:border-amber-600 text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}
                          value={isPendingMove ? pendingMove.status : lead.status}
                          onChange={(e) => setPendingMove({ id: lead.id, status: e.target.value })}
                        >
                          {etapas.map(et => (
                            <option key={et.id} value={et.id.toUpperCase()} className="dark:bg-slate-900">
                              {et.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {isPendingMove && (
                        <button 
                          onClick={() => handleConfirmMove(lead.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all animate-in fade-in zoom-in duration-200 uppercase tracking-tighter"
                        >
                          <SendHorizontal size={12} /> Mover
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 p-4">
                    {lead.telefone ? (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Phone size={12} className="text-blue-500" />
                        <span className="text-[10px] font-bold">{lead.telefone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg w-fit border border-amber-500/20" title="Sem telefone: Disparos de WhatsApp desabilitados">
                        <AlertTriangle size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Sem WhatsApp</span>
                      </div>
                    )}
                  </td>
                  <td className="bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-[10px] font-medium truncate max-w-[150px]">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                         <MapPin size={12} className="text-slate-400" />
                         <span className="text-[10px] font-medium text-slate-400 italic">Origem: {lead.origemLead || 'Direto'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="bg-white dark:bg-slate-900/50 border-y border-r border-slate-200 dark:border-slate-800 last:rounded-r-xl p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onHistory(lead)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        title="Ver Timeline"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => onView(lead)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        title="Ver Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => onEdit(lead)}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingId(lead.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={4} className="bg-slate-50/50 dark:bg-slate-900/30 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-2xl px-12 py-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                          <Texto variant="detalhe" className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Contato</Texto>
                          <Texto variant="corpo" className="text-sm font-bold mb-1 text-slate-800 dark:text-slate-100">{lead.nomeContato}</Texto>
                          <Texto variant="corpo" className="text-xs text-slate-500 font-medium truncate">{lead.email}</Texto>
                        </div>
                        <div>
                          <Texto variant="detalhe" className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Empresa</Texto>
                          <Texto variant="corpo" className="text-sm font-bold mb-1 flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                            <Building2 size={14} className="text-blue-500" /> {lead.nomeEmpresa || 'Não informada'}
                          </Texto>
                          <Texto variant="corpo" className="text-[10px] font-mono text-slate-500">CNPJ: {lead.cnpj || 'Sob consulta'}</Texto>
                        </div>
                        <div>
                          <Texto variant="detalhe" className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Serviço</Texto>
                          <div className="inline-flex px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                            {lead.tipoServico?.replaceAll('_', ' ') || 'Consultoria Geral'}
                          </div>
                        </div>
                        <div className="flex flex-col justify-end items-end gap-2">
                           <Botao variant="outline" onClick={() => onEdit(lead)} className="w-full text-[10px] h-8">
                              Acessar Cadastro Completo
                           </Botao>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <ConfirmacaoModal
        aberto={!!deletingId}
        titulo="Excluir Lead?"
        descricao="Esta ação é irreversível e todos os dados e histórico vinculados a este lead serão removidos permanentemente."
        onFechar={() => setDeletingId(null)}
        onConfirmar={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
