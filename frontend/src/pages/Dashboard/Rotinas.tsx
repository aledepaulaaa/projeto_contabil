import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Building2,
  ExternalLink,
  FileSearch
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { GradeDocumentos } from '../../components/organisms/GradeDocumentos/GradeDocumentos';
import { UploadArea } from '../../components/atoms/UploadArea/UploadArea';
import { useDocumentos } from '../../hooks/useDocumentos';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

interface Obrigacao {
  id: string;
  empresa: string;
  regime: 'MEI' | 'SIMPLES' | 'PRESUMIDO' | 'REAL';
  tipo: 'DAS' | 'DARF' | 'FGTS' | 'ISS';
  vencimento: string;
  status: 'A FAZER' | 'ATRASADA' | 'ENTREGUE';
}

const obrigacoesIniciais: Obrigacao[] = [
  { id: '1', empresa: 'Lanchonete Silva', regime: 'MEI', tipo: 'DAS', vencimento: '2024-03-20', status: 'A FAZER' },
  { id: '2', empresa: 'Oficina Mecânica', regime: 'SIMPLES', tipo: 'DARF', vencimento: '2024-03-15', status: 'ATRASADA' },
  { id: '3', empresa: 'Consultoria Tech', regime: 'PRESUMIDO', tipo: 'ISS', vencimento: '2024-03-25', status: 'A FAZER' },
  { id: '4', empresa: 'Mercado Central', regime: 'REAL', tipo: 'FGTS', vencimento: '2024-03-10', status: 'ENTREGUE' },
];

export const Rotinas: React.FC = () => {
  const [obrigacoes] = useState<Obrigacao[]>(obrigacoesIniciais);
  const [regimeFiltro, setRegimeFiltro] = useState<string>('TODOS');
  const { documentos, isLoading, uploadDocumento, isUploading } = useDocumentos();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENTREGUE': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'ATRASADA': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENTREGUE': return <CheckCircle2 size={14} />;
      case 'ATRASADA': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const filteredObrigacoes = regimeFiltro === 'TODOS' 
    ? obrigacoes 
    : obrigacoes.filter(o => o.regime === regimeFiltro);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Texto variant="titulo" className="flex items-center gap-3">
            <Calendar className="text-blue-600 dark:text-blue-500" size={28} />
            Rotinas & Obrigações Fiscais
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Gestão de entregas mensais e conformidade tributária</Texto>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar empresa..."
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 min-w-[240px] text-text-main transition-colors"
            />
          </div>
          <Botao variant="outline" className="flex items-center gap-2 border-slate-200 dark:border-slate-800 text-text-main shadow-sm dark:shadow-none">
            <Filter size={16} />
            Filtros
          </Botao>
        </div>
      </div>

      {/* Seletor de Regime */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar transition-colors">
        {['TODOS', 'MEI', 'SIMPLES', 'PRESUMIDO', 'REAL'].map((r) => (
          <button
            key={r}
            onClick={() => setRegimeFiltro(r)}
            className={`
              px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
              ${regimeFiltro === r 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-white dark:bg-slate-900 text-text-secondary border border-slate-200 dark:border-slate-800 hover:border-blue-500/30'}
            `}
          >
            {r === 'TODOS' ? 'Todos os Regimes' : r}
          </button>
        ))}
      </div>

      {/* Tabela de Rotinas */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                <th className="px-6 py-4"><Texto variant="label">Empresa</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Regime</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Obrigação</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Vencimento</Texto></th>
                <th className="px-6 py-4"><Texto variant="label">Status</Texto></th>
                <th className="px-6 py-4 text-right"><Texto variant="label">Ações</Texto></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
              {filteredObrigacoes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
                        <Building2 size={16} />
                      </div>
                      <Texto variant="corpo" className="font-semibold">{item.empresa}</Texto>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-text-secondary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded transition-colors">
                      {item.regime}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-text-secondary" />
                      <Texto variant="corpo">{item.tipo}</Texto>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Texto variant="detalhe" className="font-mono text-sm">
                      {new Date(item.vencimento).toLocaleDateString('pt-BR')}
                    </Texto>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)} transition-colors`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Ver detalhes" className="p-2 text-text-secondary hover:text-blue-600 dark:hover:text-white transition-colors">
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        title="Enviar WhatsApp"
                        className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredObrigacoes.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 transition-colors">
              <Calendar size={32} />
            </div>
            <Texto variant="corpo" className="font-semibold">Nenhuma obrigação encontrada</Texto>
            <Texto variant="detalhe" className="mt-1">Tente ajustar seus filtros para encontrar o que procura.</Texto>
          </div>
        )}
      </Card>

      {/* Seção de Homologação de Documentos */}
      <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <Texto variant="subtitulo" className="flex items-center gap-3">
            <FileSearch size={22} className="text-blue-600 dark:text-blue-500" />
            Homologação de Guias (PDF)
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Carregue as guias geradas para validação e envio automático ao cliente</Texto>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UploadArea onFileSelect={uploadDocumento} isUploading={isUploading} />
          </div>
          <div className="lg:col-span-2">
            <GradeDocumentos documentos={documentos || []} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
