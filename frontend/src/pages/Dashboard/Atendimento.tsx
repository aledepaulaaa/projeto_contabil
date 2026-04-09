import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Texto } from '../../components/atoms/Texto/Texto';
import { WhatsAppConnection } from '../../components/organisms/Atendimento/WhatsAppConnection';
import { ContactSidebar } from '../../components/organisms/Atendimento/ContactSidebar';
import { ChatWindow } from '../../components/organisms/Atendimento/ChatWindow';
import { MessageTemplates } from '../../components/organisms/Atendimento/MessageTemplates';
import { MessageSquare, Zap, Settings, LayoutDashboard } from 'lucide-react';

type AtendimentoTab = 'chats' | 'automacao' | 'conexao';

export const Atendimento: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AtendimentoTab>('chats');
    const [selectedContact, setSelectedContact] = useState<any>(null);

    const tabs = [
        { id: 'chats', label: 'Conversas', icon: MessageSquare },
        { id: 'automacao', label: 'Automação', icon: Zap },
        { id: 'conexao', label: 'Conexão', icon: Settings },
    ];

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-12 animate-fade-in h-full min-h-[600px] overflow-hidden">
            {/* Barra de Navegação Interna do Módulo */}
            <div className="flex lg:flex-col items-center justify-center lg:justify-start gap-4 bg-white dark:bg-slate-900/80 p-3 lg:p-4 rounded-[1.5rem] lg:rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl shrink-0 z-10 transition-all backdrop-blur-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AtendimentoTab)}
                        className={`
                            p-3 lg:p-5 rounded-xl lg:rounded-[1.5rem] transition-all relative group
                            ${activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                                : 'text-slate-400 hover:text-blue-500 hover:bg-blue-500/5'}
                        `}
                        title={tab.label}
                    >
                        <tab.icon size={window.innerWidth < 1024 ? 20 : 26} />
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap hidden lg:block">
                            {tab.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Área de Conteúdo Dinâmico */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-transparent rounded-[2.5rem] overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'chats' && (
                        <motion.div 
                            key="chats"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl rounded-[2.5rem] min-w-[320px] overflow-x-auto no-scrollbar"
                        >
                            <div className="flex min-w-[1000px] lg:min-w-0 flex-1">
                                <ContactSidebar 
                                    onSelect={(c) => setSelectedContact(c)}
                                    selectedId={selectedContact?.id}
                                />
                                
                                <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/20 relative min-w-0">
                                    {selectedContact ? (
                                        <ChatWindow 
                                            lead={selectedContact}
                                            onFechar={() => setSelectedContact(null)}
                                            onTransferir={() => console.log('Transferir')}
                                            onEncerrar={() => setSelectedContact(null)}
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                                            <div className="w-24 h-24 bg-blue-600/5 text-blue-500 rounded-full flex items-center justify-center">
                                                <LayoutDashboard size={48} className="opacity-20" />
                                            </div>
                                            <div className="max-w-xs">
                                                <Texto variant="titulo" className="text-xl mb-2">Central de Atendimento</Texto>
                                                <Texto variant="corpo" className="text-slate-400">Selecione um contato na lista lateral para iniciar ou continuar um atendimento.</Texto>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'automacao' && (
                        <motion.div 
                            key="automacao"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="flex-1 overflow-y-auto no-scrollbar min-w-[320px] overflow-x-auto"
                        >
                            <MessageTemplates />
                        </motion.div>
                    )}

                    {activeTab === 'conexao' && (
                        <motion.div 
                            key="conexao"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex items-center justify-center p-4 lg:p-10 min-w-[320px]"
                        >
                            <div className="max-w-2xl w-full">
                                <WhatsAppConnection />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
