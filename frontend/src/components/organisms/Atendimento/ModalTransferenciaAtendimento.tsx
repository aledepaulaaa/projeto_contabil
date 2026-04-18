import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, User, Search, Forward, Loader2 } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { DepartamentoService, type DepartamentoResponse } from '../../../services/DepartamentoService';
import { UsuarioService, type UsuarioResponse } from '../../../services/UsuarioService';

interface ModalTransferenciaAtendimentoProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dados: { novoDeptoId?: string; novoAtendenteId?: string }) => void;
    leadNome: string;
}

export const ModalTransferenciaAtendimento: React.FC<ModalTransferenciaAtendimentoProps> = ({ 
    isOpen, onClose, onConfirm, leadNome 
}) => {
    const [tipo, setTipo] = useState<'DEPTO' | 'OPERADOR'>('DEPTO');
    const [departamentos, setDepartamentos] = useState<DepartamentoResponse[]>([]);
    const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState('');
    const [selecionado, setSelecionado] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            carregarDados();
        }
    }, [isOpen, tipo]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            if (tipo === 'DEPTO') {
                const data = await DepartamentoService.listar();
                setDepartamentos(data);
            } else {
                const data = await UsuarioService.listarUsuarios();
                setUsuarios(data);
            }
        } catch (error) {
            console.error('Erro ao carregar dados para transferência:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmar = () => {
        if (!selecionado) return;
        
        if (tipo === 'DEPTO') {
            onConfirm({ novoDeptoId: selecionado });
        } else {
            onConfirm({ novoAtendenteId: selecionado });
        }
    };

    const filtrados = tipo === 'DEPTO' 
        ? departamentos.filter(d => d.nome?.toLowerCase().includes(filtro.toLowerCase()))
        : usuarios.filter(u => u.nome?.toLowerCase().includes(filtro.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <Forward size={24} />
                        </div>
                        <div>
                            <Texto variant="titulo" className="text-xl">Transferir Atendimento</Texto>
                            <Texto variant="detalhe" className="text-slate-400">Direcionar <b>{leadNome}</b> para outro destino</Texto>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Alternância de Tipo */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-6">
                        <button 
                            onClick={() => { setTipo('DEPTO'); setSelecionado(null); }}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${tipo === 'DEPTO' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Users size={16} /> Para Departamento
                        </button>
                        <button 
                            onClick={() => { setTipo('OPERADOR'); setSelecionado(null); }}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${tipo === 'OPERADOR' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <User size={16} /> Para Operador
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={tipo === 'DEPTO' ? "Buscar departamentos..." : "Buscar operadores..."}
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                        />
                    </div>

                    {/* Lista Scrolável */}
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2 pr-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                <Texto variant="detalhe">Carregando opções...</Texto>
                            </div>
                        ) : (
                            filtrados.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelecionado(item.id)}
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${selecionado === item.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-transparent border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selecionado === item.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {item.nome[0]}
                                        </div>
                                        <div className="text-left">
                                            <Texto variant="corpo" className={`text-sm font-bold ${selecionado === item.id ? 'text-white' : ''}`}>{item.nome}</Texto>
                                            <Texto variant="detalhe" className={`text-[10px] uppercase tracking-widest ${selecionado === item.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {tipo === 'DEPTO' ? 'Setor Especializado' : (item as UsuarioResponse).papel}
                                            </Texto>
                                        </div>
                                    </div>
                                    {selecionado === item.id && (
                                        <div className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center">
                                            <Users size={14} />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                        {!loading && filtrados.length === 0 && (
                            <div className="py-12 text-center text-slate-400 italic">
                                Nenhum resultado encontrado.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-3">
                    <Botao onClick={onClose} variant="outline" className="flex-1 h-14">Cancelar</Botao>
                    <Botao 
                        onClick={handleConfirmar} 
                        disabled={!selecionado}
                        className={`flex-1 h-14 shadow-xl ${!selecionado ? 'opacity-50 grayscale' : 'shadow-blue-500/20'}`}
                    >
                        Confirmar Transferência
                    </Botao>
                </div>
            </motion.div>
        </div>
    );
};
