import React, { useState, useEffect } from 'react';
import { Card } from '../../atoms/Card/Card';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { MessageSquare, Send, Save, RefreshCw, Zap, Clock, CheckCircle, Bold, Italic, Type, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const templatesIniciais = [
    { id: 'PROPOSTA', label: 'Proposta Pronta', trigger: 'Lead movido para Proposta', icon: MessageSquare, text: 'Olá {nome}, sua proposta da {empresa} já está pronta! 📄 Você pode visualize-la pelo link: {link_documento}. Vamos conversar?' },
    { id: 'AGUARDANDO', label: 'Aguardando Aprovação', trigger: 'Lead movido para Aguardando', icon: Clock, text: 'Olá {nome}, seu processo está aguardando aprovação final para seguirmos com o fechamento. Alguma dúvida?' },
    { id: 'FECHAMENTO', label: 'Contrato para Assinatura', trigger: 'Lead movido para Fechamento', icon: CheckCircle, text: 'Olá {nome}, seu contrato já foi gerado ✍️. Acesse para assinar digitalmente: {link_zapsign}' },
];

import { LeadService } from '../../../services/LeadService';
import { EMOJIS } from '../../../consts/emojis';

export const MessageTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>(templatesIniciais);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(templatesIniciais[0]);
    const [showEmojis, setShowEmojis] = useState(false);

    useEffect(() => {
        carregarTemplates();
    }, []);

    const carregarTemplates = async () => {
        try {
            const dados = await LeadService.listarTemplatesAutomacao();
            
            // Mescla com os padrões
            const mesclados = templatesIniciais.map(padrao => {
                const salvo = dados.find(d => d.gatilho === padrao.id);
                if (salvo) {
                    return { ...padrao, text: salvo.texto };
                }
                return padrao;
            });
            
            setTemplates(mesclados);
            if (mesclados.length > 0) {
                // Atualiza o template selecionado atualmente com a versão do banco
                setSelectedTemplate((prev: any) => mesclados.find(m => m.id === prev.id) || mesclados[0]);
            }
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            // Fallback para sessionStorage se a API falhar
            const saved = sessionStorage.getItem('atendimento_templates');
            if (saved) {
                const parsed = JSON.parse(saved);
                setTemplates(parsed);
                setSelectedTemplate(parsed[0]);
            }
        } finally {
        }
    };

    const handleSave = async () => {
        try {
            await LeadService.salvarTemplateAutomacao(selectedTemplate.id, selectedTemplate.text);
            
            const updated = templates.map((t: any) => t.id === selectedTemplate.id ? selectedTemplate : t);
            setTemplates(updated);
            sessionStorage.setItem('atendimento_templates', JSON.stringify(updated));
            alert('Automação salva com sucesso e já está ativa para os próximos disparos!');
        } catch (error) {
            console.error('Erro ao salvar template:', error);
            alert('Erro ao salvar automação. Verifique sua conexão.');
        }
    };

    const insertText = (before: string, after: string = '') => {
        const textarea = document.getElementById('template-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = selectedTemplate.text;
        const beforeSelection = text.substring(0, start);
        const selection = text.substring(start, end);
        const afterSelection = text.substring(end);

        const newText = beforeSelection + before + selection + after + afterSelection;
        setSelectedTemplate({ ...selectedTemplate, text: newText });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 10);
    };

    const handleRestore = () => {
        if (confirm('Deseja restaurar o texto padrão deste template?')) {
            const original = templatesIniciais.find(t => t.id === selectedTemplate.id);
            if (original) setSelectedTemplate({ ...selectedTemplate, text: original.text });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
            {/* Lista de Gatilhos (Esquerda) */}
            <div className="lg:w-[350px] shrink-0 space-y-4 overflow-y-auto pr-2 no-scrollbar">
                <Texto variant="titulo" className="text-xl mb-6 px-2 lg:px-6">Automações de Disparo</Texto>

                <div className="space-y-3">
                    {templates.map((tpl: any) => {
                        const Icon = tpl.id === 'PROPOSTA' ? MessageSquare : tpl.id === 'AGUARDANDO' ? Clock : CheckCircle;
                        const isActive = selectedTemplate.id === tpl.id;

                        return (
                            <button
                                key={tpl.id}
                                onClick={() => setSelectedTemplate(tpl)}
                                className={`
                                    w-full p-5 rounded-[1.5rem] flex items-center gap-4 transition-all border text-left group
                                    ${isActive
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-blue-500/50'}
                                `}
                            >
                                <div className={`p-3 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-blue-500'}`}>
                                    <Icon size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Texto variant="corpo" className={`text-sm font-black leading-tight mb-1 truncate ${isActive ? 'text-white' : ''}`}>
                                        {tpl.label}
                                    </Texto>
                                    <Texto variant="detalhe" className={`text-[10px] uppercase tracking-tighter truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                        Gatilho: {tpl.trigger.split('movido para')[1] || tpl.trigger}
                                    </Texto>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl text-center">
                    <Texto variant="detalhe" className="text-slate-400 italic text-[11px] leading-relaxed">
                        Novos gatilhos automáticos serão liberados conforme o fluxo operacional do escritório evolui.
                    </Texto>
                </div>
            </div>

            {/* Editor de Mensagem (Direita) */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl min-w-0">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-600 text-white rounded-[1.2rem] shadow-xl shadow-blue-500/20 shrink-0">
                                <Zap size={24} />
                            </div>
                            <div>
                                <Texto variant="titulo" className="text-xl leading-none mb-1">{selectedTemplate.label}</Texto>
                                <Texto variant="detalhe" className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px]">Automação Inteligente</Texto>
                            </div>
                        </div>
                        <Botao
                            variant="outline"
                            onClick={handleRestore}
                            className="!w-auto !min-h-[44px] px-5 gap-2 text-xs font-bold bg-white dark:bg-slate-800"
                        >
                            <RefreshCw size={14} /> Restaurar Padrão
                        </Botao>
                    </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto no-scrollbar space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Texto variant="label" className="text-xs uppercase tracking-widest text-slate-400 font-black">Conteúdo da Mensagem</Texto>

                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl relative">
                                <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all" title="Negrito"><Bold size={16} /></button>
                                <button onClick={() => insertText('_', '_')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all" title="Itálico"><Italic size={16} /></button>
                                <button onClick={() => insertText('~', '~')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all" title="Tachado"><Type size={16} /></button>
                                <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                                <button
                                    onClick={() => setShowEmojis(!showEmojis)}
                                    className={`p-2 rounded-lg transition-all ${showEmojis ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}
                                >
                                    <Smile size={18} />
                                </button>

                                <AnimatePresence>
                                    {showEmojis && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-50 grid grid-cols-4 gap-2 w-48"
                                        >
                                            {EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => { insertText(emoji); setShowEmojis(false); }}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xl"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="relative group">
                            <textarea
                                id="template-editor"
                                className="w-full h-56 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 text-base outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium leading-relaxed resize-none scrollbar-thin overflow-x-auto min-w-[280px]"
                                value={selectedTemplate.text}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, text: e.target.value })}
                                placeholder="Digite sua mensagem de automação aqui..."
                            />
                            <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm">
                                    {selectedTemplate.text.length} caracteres
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { tag: '{nome}', label: 'Nome do Lead' },
                            { tag: '{empresa}', label: 'Empresa' },
                            { tag: '{link_documento}', label: 'Link Proposta' },
                            { tag: '{link_zapsign}', label: 'Link Assinatura' }
                        ].map(item => (
                            <button
                                key={item.tag}
                                onClick={() => insertText(item.tag)}
                                className="px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] font-black text-blue-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all uppercase tracking-wider"
                                title={`Inserir ${item.label}`}
                            >
                                + {item.tag}
                            </button>
                        ))}
                    </div>

                    <Card className="bg-gradient-to-br from-blue-600/5 to-transparent dark:from-blue-500/10 border-blue-500/20 p-8 flex flex-col md:flex-row items-center gap-8 group">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/10 shadow-xl group-hover:scale-110 transition-transform shrink-0">
                            <Send size={32} />
                        </div>
                        <div className="flex-1">
                            <Texto variant="subtitulo" className="text-lg font-black mb-2 flex items-center gap-2">
                                Pré-visualização <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] rounded-full">WHATSAPP</span>
                            </Texto>
                            <div className="bg-white/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <Texto variant="corpo" className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedTemplate.text
                                        .replace(/{nome}/g, 'Roberto Silva')
                                        .replace(/{empresa}/g, 'Biz Corp')
                                        .replace(/{link_documento}/g, 'app.financeiro.com/p/123')
                                        .replace(/{link_zapsign}/g, 'zapsign.com.br/s/456')
                                    }
                                </Texto>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Texto variant="detalhe" className="text-slate-400 italic text-[11px]">
                        As alterações feitas aqui serão aplicadas aos próximos disparos automáticos do CRM.
                    </Texto>
                    <Botao variant="primary" onClick={handleSave} className="!w-full sm:!w-auto !min-h-[56px] px-10 gap-3 font-black shadow-2xl shadow-blue-500/30">
                        <Save size={22} /> Salvar Automação
                    </Botao>
                </div>
            </div>
        </div>
    );
};
