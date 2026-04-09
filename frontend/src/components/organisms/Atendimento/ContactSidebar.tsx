import React, { useEffect, useState } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Search, Filter, Clock, User, Users, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadService } from '../../../services/LeadService';

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
}

const mockGrupos: Contato[] = [
    { id: 'g-1', nome: 'Diretoria BizCorp', membros: 12, ultimaMensagem: 'Relatório mensal disponível.', horario: '10:05', tabType: 'grupos' },
    { id: 'g-2', nome: 'Financeiro TechGreen', membros: 5, ultimaMensagem: 'Aprovação de NF-e.', horario: 'Ontem', tabType: 'grupos' },
];

interface ContactSidebarProps {
    onSelect: (contato: any) => void;
    selectedId?: string;
}

export const ContactSidebar: React.FC<ContactSidebarProps> = ({ onSelect, selectedId }) => {
    const [activeSubTab, setActiveSubTab] = useState('chats');
    const [leads, setLeads] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        carregarContatos();
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

    const filtrarLeads = (type: string) => {
        const baseList = type === 'grupos' ? mockGrupos : leads.filter(l => l.tabType === type);
        return baseList.filter(l => 
            l.nome.toLowerCase().includes(filtro.toLowerCase()) || 
            l.empresa?.toLowerCase().includes(filtro.toLowerCase())
        );
    };

    const renderList = (type: string) => {
        const data = filtrarLeads(type);

        if (loading && type !== 'grupos') {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    <Texto variant="detalhe">Sincronizando Leads...</Texto>
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                    <MessageCircle className="opacity-20" size={48} />
                    <Texto variant="detalhe" className="text-center italic">Nenhum contato nesta categoria.</Texto>
                </div>
            );
        }

        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 space-y-1"
            >
                {data.map((item) => {
                    const isActive = selectedId === item.id;
                    
                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSelect(item)}
                            className={`
                                w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all group border
                                ${isActive 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                            `}
                        >
                            {/* Avatar / Icon */}
                            <div className={`
                                w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-xl shrink-0 transition-transform group-hover:scale-110
                                ${isActive 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5'}
                            `}>
                                {type === 'grupos' ? <Users size={20} /> : item.nome[0]}
                            </div>

                            {/* Detalhes */}
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <Texto variant="corpo" className={`text-sm font-black truncate ${isActive ? 'text-white' : ''}`}>
                                        {item.nome}
                                    </Texto>
                                    {item.horario && (
                                        <Texto variant="detalhe" className={`text-[9px] font-bold uppercase tracking-widest shrink-0 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {item.horario}
                                        </Texto>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    {type === 'contatos' ? (
                                        <Texto variant="detalhe" className={`text-[11px] font-medium truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                            {item.whatsapp || item.empresa}
                                        </Texto>
                                    ) : (
                                        <Texto variant="detalhe" className={`text-xs truncate font-medium ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                            {item.ultimaMensagem || item.empresa}
                                        </Texto>
                                    )}

                                    {/* Badges Específicos */}
                                    {item.quantidadeMensagensNaoLidas ? item.quantidadeMensagensNaoLidas > 0 && (
                                        <div className={`
                                            flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black
                                            ${isActive ? 'bg-white text-blue-600' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}
                                        `}>
                                            {item.quantidadeMensagensNaoLidas}
                                        </div>
                                    ) : null}

                                    {type === 'fila' && (
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                            <Clock size={10} /> {item.espera}
                                        </div>
                                    )}
                                    {type === 'grupos' && (
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {item.membros} MEMBROS
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 w-full lg:w-[400px] shrink-0">
            {/* Header da Sidebar */}
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <MessageCircle size={24} />
                        </div>
                        <Texto variant="titulo" className="text-xl">Conversas</Texto>
                    </div>
                    <button onClick={carregarContatos} className={`p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-all ${loading ? 'animate-pulse' : ''}`}>
                        <Filter size={18} />
                    </button>
                </div>
                
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

                {/* Sub-tabs de Navegação Interna */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[1.2rem] border border-slate-200/50 dark:border-white/5">
                    {[
                        { id: 'chats', label: 'Chats', icon: MessageCircle, count: leads.filter(l => l.tabType === 'chats').length },
                        { id: 'fila', label: 'Fila', icon: Clock, count: leads.filter(l => l.tabType === 'fila').length },
                        { id: 'contatos', label: 'Contatos', icon: User, count: leads.filter(l => l.tabType === 'contatos').length },
                        { id: 'grupos', label: 'Grupos', icon: Users, count: 2 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`
                                flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-1 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all
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

            {/* Lista de Conteúdo */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                <AnimatePresence mode="wait">
                    {renderList(activeSubTab)}
                </AnimatePresence>

                {/* Info de Rodapé (Opcional) */}
                <div className="mt-8 px-6 text-center">
                    <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 inline-flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        <AlertCircle size={14} /> Sincronizado com CRM
                    </div>
                </div>
            </div>
        </div>
    );
};
