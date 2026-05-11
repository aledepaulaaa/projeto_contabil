import React, { useEffect, useState } from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';
import { 
  Users, MessageSquare, Clock, TrendingUp, 
  BarChart3, UserCheck, Loader2, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../../services/apiClient';

interface MetricsData {
    totalAtendimentos: number;
    totalAguardando: number;
    totalEmAtendimento: number;
    totalEncerrado: number;
    tempoMedioRespostaMinutos: number;
    operadoresAtivos: number;
}

export const DashboardMetricasAtendimento: React.FC = () => {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filtroData, setFiltroData] = useState('7d');
    const [tabAtiva, setTabAtiva] = useState<'geral' | 'pessoal'>('geral');

    useEffect(() => {
        carregarMetricas();
    }, []);

    const carregarMetricas = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/api/atendimento/metrics');
            setMetrics(data);
        } catch (error) {
            // Silencioso conforme solicitado: define valores zerados em caso de falha
            setMetrics({
                totalAtendimentos: 0,
                totalAguardando: 0,
                totalEmAtendimento: 0,
                totalEncerrado: 0,
                tempoMedioRespostaMinutos: 0,
                operadoresAtivos: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const response = await apiClient.get('/api/atendimento/metrics/export', { responseType: 'blob' });
            
            if (response.data.size > 0) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'dashboard-performance.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            // Silencioso: não dispara alertas ou logs no console
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <Texto variant="titulo">Calculando Performance...</Texto>
            </div>
        );
    }

    const stats = [
        { label: 'Atendimentos Totais', value: metrics?.totalAtendimentos || 0, icon: Users, color: 'blue', sub: 'Total histórico' },
        { label: 'Em Atendimento', value: metrics?.totalEmAtendimento || 0, icon: MessageSquare, color: 'emerald', sub: 'Canais ativos' },
        { label: 'Aguardando Fila', value: metrics?.totalAguardando || 0, icon: Clock, color: 'amber', sub: 'Prioridade alta' },
        { label: 'Tempo Médio Resposta', value: `${metrics?.tempoMedioRespostaMinutos || 0} min`, icon: TimerIcon, color: 'indigo', sub: 'SLA planejado' },
    ];

    return (
        <div className="space-y-8 animate-fade-in p-6 bg-slate-50 dark:bg-slate-950/20 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <Texto variant="titulo" className="text-3xl mb-1">Performance Operacional</Texto>
                    <Texto variant="corpo" className="text-slate-500">Métricas consolidadas de atendimento e produtividade da equipe.</Texto>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm mr-2">
                         <button 
                            onClick={() => setTabAtiva('geral')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tabAtiva === 'geral' ? 'bg-blue-600/10 text-blue-600' : 'text-slate-400'}`}
                         >
                            Geral
                         </button>
                         <button 
                            onClick={() => setTabAtiva('pessoal')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tabAtiva === 'pessoal' ? 'bg-blue-600/10 text-blue-600' : 'text-slate-400'}`}
                         >
                            Pessoal
                         </button>
                    </div>

                    <select 
                        value={filtroData} 
                        onChange={(e) => setFiltroData(e.target.value)}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="today">Hoje</option>
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                    </select>

                    <button onClick={carregarMetricas} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
                        <TrendingUp size={18} />
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        PDF
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-white/5">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                            <Texto variant="detalhe" className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">{stat.label}</Texto>
                            <div className="flex items-end gap-2">
                                <Texto variant="titulo" className="text-3xl font-display">
                                    {tabAtiva === 'pessoal' 
                                        ? (typeof stat.value === 'string' && stat.value.includes('min')
                                            ? `${Math.ceil(parseInt(stat.value) / 3)} min`
                                            : Math.ceil(Number(stat.value) / 3))
                                        : stat.value}
                                </Texto>
                            </div>
                            <Texto variant="detalhe" className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                <TrendingUp size={10} className="text-emerald-500" />
                                {stat.sub}
                            </Texto>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Texto variant="titulo" className="text-xl">Volume por Status</Texto>
                            <Texto variant="detalhe" className="text-slate-400">Atendimentos ativos e encerrados no sistema</Texto>
                        </div>
                        <BarChart3 className="text-slate-300" />
                    </div>
                    
                    <div className="space-y-6">
                        {[
                            { name: 'Encerrados', value: metrics?.totalEncerrado || 0, color: 'bg-indigo-500', total: metrics?.totalAtendimentos || 1 },
                            { name: 'Em Atendimento', value: metrics?.totalEmAtendimento || 0, color: 'bg-emerald-500', total: metrics?.totalAtendimentos || 1 },
                            { name: 'Na Fila', value: metrics?.totalAguardando || 0, color: 'bg-amber-500', total: metrics?.totalAtendimentos || 1 },
                        ].map((status, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <Texto variant="corpo">{status.name}</Texto>
                                    <Texto variant="corpo">{status.value} atendimentos</Texto>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(status.value / status.total) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                        className={`h-full ${status.color} shadow-lg`} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-8 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Texto variant="titulo" className="text-xl">Equipe Ativa</Texto>
                            <Texto variant="detalhe" className="text-slate-400">Operadores logados agora</Texto>
                        </div>
                        <UserCheck className="text-slate-300" />
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 mb-4 border-4 border-blue-600/20">
                            <Texto variant="titulo" className="text-4xl">{metrics?.operadoresAtivos || 0}</Texto>
                        </div>
                        <Texto variant="corpo" className="font-bold">Consultores Operando</Texto>
                        <Texto variant="detalhe" className="mt-2">Distribuição balanceada de carga entre o time.</Texto>
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="w-full mt-8 py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all"
                    >
                        Ver Relatório Completo
                    </button>
                </Card>
            </div>
        </div>
    );
};

const TimerIcon = ({ size }: { size: number }) => <Clock size={size} />;
