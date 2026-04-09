import { FileCheck, Handshake, Target, Users, Clock, XCircle } from "lucide-react";

// Mapeamento de status para etapas do funil (compatibilidade backend)
export const statusParaEtapa = (status: string): string => {
    return status; // Backend agora usa os mesmos IDs do Funil
};

export const etapas = [
    { id: 'LEAD', label: 'Lead', icon: Users, color: 'text-slate-500', tendency: '' },
    { id: 'QUALIFICACAO', label: 'Qualificação', icon: Target, color: 'text-orange-500', tendency: '' },
    { id: 'PROPOSTA', label: 'Proposta', icon: FileCheck, color: 'text-blue-500', tendency: '' },
    { id: 'AGUARDANDO', label: 'Aguardando Aprovação', icon: Clock, color: 'text-amber-500', tendency: '' },
    { id: 'FECHAMENTO', label: 'Fechamento', icon: Handshake, color: 'text-emerald-500', tendency: '' },
    { id: 'NAO_FECHOU', label: 'Não Fechou', icon: XCircle, color: 'text-rose-500', tendency: '' },
];

export const origemLabel = (origem: string | null) => {
    switch (origem) {
        case 'CAMPANHA': return 'Campanha';
        case 'ORGANICO': return 'Orgânico';
        case 'INDICACAO': return 'Indicação';
        default: return null;
    }
};

export const tipoServicoLabel = (tipo: string | null) => {
    switch (tipo) {
        case 'ABERTURA': return 'Abertura';
        case 'TRANSFERENCIA': return 'Transferência';
        case 'REGULARIZACAO': return 'Regularização';
        default: return null;
    }
};
