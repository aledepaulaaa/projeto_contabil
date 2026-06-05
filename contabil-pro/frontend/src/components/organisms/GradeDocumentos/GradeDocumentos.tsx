import React from 'react';
import { FileText, Image as ImageIcon, File, Download, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Documento } from '../../../hooks/useDocumentos';
import { useResolucao } from '../../../contexts/ResolucaoContext';

interface GradeDocumentosProps {
  documentos: Documento[];
  isLoading: boolean;
}

export const GradeDocumentos: React.FC<GradeDocumentosProps> = ({ documentos, isLoading }) => {
  const { isMobile } = useResolucao();

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="w-8 h-8 text-rose-400" />;
    if (tipo.includes('image')) return <ImageIcon className="w-8 h-8 text-emerald-400" />;
    return <File className="w-8 h-8 text-blue-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="status">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 animate-pulse bg-white/5 border-white/10 h-32" />
        ))}
      </div>
    );
  }

  if (!documentos || documentos.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-4 opacity-50">
        <File className="w-12 h-12 text-slate-400" />
        <p className="text-slate-200 font-medium">Nenhum documento encontrado</p>
      </div>
    );
  }

  return (
    <div 
      role="grid"
      className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
    >
      {documentos.map((doc, index) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          role="row"
          className="glass-card group p-5 hover:border-blue-500/30 transition-all flex flex-col gap-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4" role="gridcell">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors">
                {getFileIcon(doc.tipo)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white truncate max-w-[150px]" title={doc.nomeOriginal}>
                  {doc.nomeOriginal}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {doc.tipo.split('/')[1]} • {formatSize(doc.tamanho)}
                </span>
              </div>
            </div>
            
            <button className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <button className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all">
              <Eye className="w-3.5 h-3.5" /> 
              {isMobile ? '' : 'Visualizar'}
            </button>
            <button className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20">
              <Download className="w-3.5 h-3.5" /> 
              {isMobile ? '' : 'Baixar'}
            </button>
            {isMobile && (
              <button className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
