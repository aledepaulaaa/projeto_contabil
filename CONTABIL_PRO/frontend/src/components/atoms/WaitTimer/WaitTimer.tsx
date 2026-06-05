import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface WaitTimerProps {
    startTimeStr?: string | null;
    showStatus?: boolean;
    onlyTimeText?: boolean;
}

export const WaitTimer: React.FC<WaitTimerProps> = ({ startTimeStr, showStatus, onlyTimeText }) => {
    const [timeDiff, setTimeDiff] = useState<string>('');
    const [statusInfo, setStatusInfo] = useState({ label: '', color: '', bg: '' });

    useEffect(() => {
        if (!startTimeStr) return;

        const updateTimer = () => {
            const start = new Date(startTimeStr);
            const now = new Date();
            const diffMs = Math.max(0, now.getTime() - start.getTime());
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);

            // Formatação do texto "há X minutos"
            if (diffMin < 1) {
                setTimeDiff('há alguns segundos');
            } else {
                setTimeDiff(`há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`);
            }

            // Lógica de SLA (V3.1)
            if (diffSec < 90) {
                setStatusInfo({ label: 'Chegou agora', color: 'text-emerald-600', bg: 'bg-emerald-100' });
            } else if (diffSec < 120) {
                setStatusInfo({ label: 'Aguardando ainda', color: 'text-amber-600', bg: 'bg-amber-100' });
            } else {
                setStatusInfo({ label: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-100' });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000); // Atualiza a cada 1 segundo (tempo real)
        return () => clearInterval(interval);
    }, [startTimeStr]);

    if (!startTimeStr) return null;

    if (onlyTimeText) {
        return <span className="wait-timer-text">{timeDiff}</span>;
    }

    return (
        <span className="inline-flex items-center gap-2">
            {showStatus && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
            )}
            {!showStatus && (
                <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1">
                    <Clock size={12} className="opacity-70" />
                    {timeDiff}
                </span>
            )}
        </span>
    );
};
