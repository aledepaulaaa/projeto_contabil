import React, { useEffect, useState } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Search, Clock, User, Users, MessageCircle, AlertCircle, Loader2, RefreshCcw, ArrowRightLeft, Inbox, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadService } from '../../../services/LeadService';
import { ModalTransferenciaAtendimento } from './ModalTransferenciaAtendimento';
import { WaitTimer } from '../../atoms/WaitTimer/WaitTimer';
import { useAuthStore } from '../../../store/authStore';
import { useDepartamentos } from '../../../hooks/useDepartamentos';

interface Contato {
    id: string;
    nome: string;
    empresa?: string;
    ultimaMensagem?: string;
    horario?: string;
    espera?: string;
    departamento?: string;
    status?: string;
    whatsapp?: string;
    membros?: number;
    cor?: string;
    tabType: 'chats' | 'fila' | 'contatos' | 'grupos';
    quantidadeMensagensNaoLidas?: number;
    transferido?: boolean;
    isLeadCrm?: boolean;
    restritoAdmin?: boolean;
}

const mockGrupos: Contato[] = [];

interface ContactSidebarProps {
    onSelect: (contato: any) => void;
    selectedId?: string;
}

export const ContactSidebar: React.FC<ContactSidebarProps> = ({ onSelect, selectedId }) => {
    const [activeSubTab, setActiveSubTab] = useState('chats');
    const [leads, setLeads] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const { departamentoId } = useAuthStore();
    const { getDeptoInfo } = useDepartamentos();
    const [transferModal, setTransferModal] = useState<{ isOpen: boolean; leadId?: string; leadNome?: string }>({ isOpen: false });
    
    


    const currentDepto = getDeptoInfo(departamentoId);

    useEffect(() => {
        carregarContatos();

        const handleReload = () => carregarContatos();
        const handleAceito = (e: any) => {
            const { leadId } = e.detail;
            setLeads(prev => prev.map(l => 
                l.id === leadId ? { ...l, tabType: 'chats' as const } : l
            ));
        };

        window.addEventListener('reload-contacts', handleReload);
        window.addEventListener('atendimento-aceito', handleAceito);
        
        return () => {
            window.removeEventListener('reload-contacts', handleReload);
            window.removeEventListener('atendimento-aceito', handleAceito);
        };
    }, []);

    const carregarContatos = async () => {
        try {
            setLoading(true);
            const data = await LeadService.getContatosAtendimento();
            setLeads(data);
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
        } finally {
            setLoading(false);
        }
    };

    const sincronizarContatos = async () => {
        try {
            setLoading(true);
            await LeadService.syncContatosWhatsApp();
            await carregarContatos();
        } catch (error) {
            console.error('Erro ao sincronizar contatos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = (type: string) => {
        const baseList = type === 'grupos' ? mockGrupos : leads.filter(l => l.tabType === type);
        return baseList.filter(l =>
            l.nome.toLowerCase().includes(filtro.toLowerCase()) ||
            l.empresa?.toLowerCase().includes(filtro.toLowerCase())
        );
    };

    const handleTransferir = async (dados: { novoDeptoId?: string; novoAtendenteId?: string }) => {
        if (!transferModal.leadId) return;
        try {
            await LeadService.transferirAtendimento(transferModal.leadId, dados);
            setTransferModal({ isOpen: false });
            await carregarContatos();
        } catch (error) {
            console.error('Erro ao transferir atendimento:', error);
            alert('Erro ao transferir atendimento. Tente novamente.');
        }
    };

    const renderList = (type: string) => {
        const items = filteredLeads(type);

        if (loading && type !== 'grupos' && items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    <Texto variant="detalhe">Sincronizando...</Texto>
                </div>
            );
        }

        if (type === 'chats') {
            const leadsCrm = items.filter(l => l.isLeadCrm);
            const chatsAtivos = items.filter(l => !l.isLeadCrm);

            return (
                <div className="flex flex-col gap-6">
                    {/* Seção Horizontal de Leads do CRM */}
                    {leadsCrm.length > 0 && (
                        <div className="space-y-3">
                            <div className="px-6 flex items-center justify-between">
                                <Texto variant="detalhe" className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-500/60">
                                    Leads do CRM
                                </Texto>
                                <div className="h-[1px] flex-1 ml-4 bg-gradient-to-r from-blue-500/10 to-transparent" />
                            </div>
                            
                            <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar px-6 pb-2">
                                {leadsCrm.map(item => (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => onSelect(item)}
                                        className={`
                                            flex-shrink-0 w-48 p-4 rounded-2xl border transition-all relative text-left
                                            ${selectedId === item.id
                                                ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:border-blue-500/30'}
                                        `}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ring-1 ring-inset ${selectedId === item.id ? 'bg-white/20 text-white ring-white/10' : 'bg-blue-500/10 text-blue-500 ring-blue-500/20'}`}>
                                                    CRM
                                                </div>
                                                {(item.quantidadeMensagensNaoLidas || 0) > 0 && (
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                )}
                                                {item.restritoAdmin && (
                                                    <Lock className={`w-3 h-3 ${selectedId === item.id ? 'text-white' : 'text-rose-500'}`} />
                                                )}
                                            </div>
                                            <Texto variant="corpo" className={`text-xs font-bold truncate ${selectedId === item.id ? 'text-white' : ''}`}>
                                                {item.nome}
                                            </Texto>
                                            <Texto variant="detalhe" className={`text-[10px] truncate ${selectedId === item.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {item.empresa || 'Empresa não informada'}
                                            </Texto>
                                            <div className={`mt-1 text-[9px] font-black uppercase tracking-widest ${selectedId === item.id ? 'text-white/60' : 'text-amber-500'}`}>
                                                {item.status}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chats Normais */}
                    <div className="space-y-1">
                        {chatsAtivos.length > 0 && (
                            <div className="px-6 mb-2">
                                <Texto variant="detalhe" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                    Conversas Ativas
                                </Texto>
                            </div>
                        )}
                        {chatsAtivos.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelect(item)}
                                className={`
                                    mx-4 px-4 py-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border
                                    ${selectedId === item.id
                                        ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 translate-x-1'
                                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-100 dark:hover:border-white/5'}
                                `}
                            >
                                <div className={`
                                    w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm
                                    ${selectedId === item.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5'}
                                `}>
                                    {item.nome[0]}
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <Texto variant="corpo" className={`text-sm font-black truncate ${selectedId === item.id ? 'text-white' : ''}`}>
                                            {item.nome}
                                        </Texto>
                                        {item.horario && (
                                            <Texto variant="detalhe" className={`text-[9px] font-bold uppercase tracking-widest shrink-0 ${selectedId === item.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {item.horario}
                                            </Texto>
                                        )}
                                        {item.restritoAdmin && (
                                            <Lock size={10} className={selectedId === item.id ? 'text-white' : 'text-rose-500'} />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        {item.transferido && (
                                            <div className={`
                                                flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter
                                                ${selectedId === item.id ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 border border-amber-500/10'}
                                            `}>
                                                <ArrowRightLeft size={8} /> Transferido
                                            </div>
                                        )}
                                        <div className={`
                                            px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border
                                            ${selectedId === item.id ? 'bg-white/10 text-white border-transparent' : getDeptoInfo(item.departamento).bgLight + ' ' + getDeptoInfo(item.departamento).color}
                                        `}>
                                            {getDeptoInfo(item.departamento).label}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                            <Texto variant="detalhe" className={`text-xs truncate font-medium ${selectedId === item.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {item.ultimaMensagem || item.empresa || 'Sem mensagens'}
                                            </Texto>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTransferModal({
                                                        isOpen: true,
                                                        leadId: item.id,
                                                        leadNome: item.nome
                                                    });
                                                }}
                                                className={`
                                                    p-1.5 rounded-lg transition-all shrink-0
                                                    ${selectedId === item.id
                                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                                        : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'}
                                                `}
                                                title="Transferir Atendimento"
                                            >
                                                <ArrowRightLeft size={12} />
                                            </button>
                                        </div>

                                        {(item.quantidadeMensagensNaoLidas || 0) > 0 && (
                                            <div className={`
                                                flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black
                                                ${selectedId === item.id ? 'bg-white text-blue-600' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}
                                            `}>
                                                {item.quantidadeMensagensNaoLidas}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-40">
                            <MessageCircle size={48} className="mb-4 text-slate-300" />
                            <Texto variant="corpo" className="font-bold mb-1">Nenhuma conversa ativa</Texto>
                            <Texto variant="detalhe">Aguarde interações ou mova leads para etapas de proposta.</Texto>
                        </div>
                    )}
                </div>
            );
        }

        // Renderização padrão para outras abas (Fila, Contatos, Grupos)
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 px-10 text-center opacity-30">
                    <Inbox size={48} strokeWidth={1} className="mb-4" />
                    <Texto variant="corpo" className="font-bold mb-1">Nada por aqui</Texto>
                    <Texto variant="detalhe" className="max-w-[180px]">Nenhum item encontrado nesta categoria.</Texto>
                </div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
            >
                {items.map((item, index) => {
                    const isActive = selectedId === item.id;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelect(item)}
                            className={`
                                mx-4 px-4 py-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border
                                ${isActive
                                    ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 translate-x-1'
                                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-100 dark:hover:border-white/5'}
                            `}
                        >
                            <div className={`
                                w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0
                                ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5'}
                            `}>
                                {type === 'grupos' ? <Users size={20} /> : item.nome[0]}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <Texto variant="corpo" className={`text-sm font-black truncate ${isActive ? 'text-white' : ''}`}>
                                    {item.nome}
                                </Texto>
                                <Texto variant="detalhe" className={`text-[11px] truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {item.whatsapp || item.empresa || (type === 'grupos' ? `${item.membros} membros` : '')}
                                </Texto>
                            </div>
                            {type === 'fila' && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                    <Clock size={10} /> <WaitTimer startTimeStr={item.espera || null} />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 w-full lg:w-[400px] shrink-0">
            {/* Header */}
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <MessageCircle size={24} />
                        </div>
                        <div className="flex flex-col">
                            <Texto variant="titulo" className="text-xl">Conversas</Texto>
                            <div className={`inline-flex items-center h-6 px-1.5 rounded text-[10px] font-bold uppercase tracking-widest border ${currentDepto.bgLight} ${currentDepto.color} w-fit`}>
                                Setor: {currentDepto.label}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={sincronizarContatos}
                            disabled={loading}
                            className={`p-2.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}
                            title="Sincronizar Contatos"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </div>

                {/* Busca */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar mensagens ou leads..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                </div>

                {/* Sub-tabs */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[1.2rem] border border-slate-200/50 dark:border-white/5">
                    {[
                        { id: 'chats', label: 'Chats', icon: MessageCircle, count: leads.filter(l => l.tabType === 'chats').length },
                        { id: 'fila', label: 'Fila', icon: Clock, count: leads.filter(l => l.tabType === 'fila').length },
                        { id: 'contatos', label: 'Contatos', icon: User, count: leads.filter(l => l.tabType === 'contatos').length },
                        { id: 'grupos', label: 'Grupos', icon: Users, count: 0 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`
                                flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all
                                ${activeSubTab === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl shadow-black/5 ring-1 ring-black/5'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}
                            `}
                        >
                            <tab.icon size={13} className="shrink-0" />
                            <span className="truncate">{tab.label}</span>
                            {!!tab.count && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeSubTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                <AnimatePresence mode="wait">
                    {renderList(activeSubTab)}
                </AnimatePresence>

                <div className="mt-8 px-6 text-center">
                    <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 inline-flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        <AlertCircle size={14} /> Sincronizado com CRM
                    </div>
                </div>
            </div>

            {/* Modal de Transferência */}
            <ModalTransferenciaAtendimento
                isOpen={transferModal.isOpen}
                onClose={() => setTransferModal({ isOpen: false })}
                onConfirm={handleTransferir}
                leadNome={transferModal.leadNome || ''}
            />
        </div>
    );
};
