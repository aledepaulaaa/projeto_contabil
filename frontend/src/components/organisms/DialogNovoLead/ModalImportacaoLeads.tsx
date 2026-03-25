import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { LeadService } from '../../../services/LeadService';

interface ModalImportacaoLeadsProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

export const ModalImportacaoLeads: React.FC<ModalImportacaoLeadsProps> = ({ aberto, onFechar, onSucesso }) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'sucesso' | 'erro'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        setArquivo(file);
        setStatus('idle');
      } else {
        setStatus('erro');
        setErroMsg('Por favor, selecione apenas arquivos CSV.');
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setArquivo(file);
      setStatus('idle');
    }
  };

  const handleImportar = async () => {
    if (!arquivo) return;

    setStatus('uploading');
    try {
      await LeadService.importarLeads(arquivo);
      setStatus('sucesso');
      setTimeout(() => {
        onSucesso();
        onFechar();
        // Reset state
        setArquivo(null);
        setStatus('idle');
      }, 2000);
    } catch (err: any) {
      setStatus('erro');
      setErroMsg(err.response?.data?.message || 'Falha ao importar leads. Verifique o formato do arquivo.');
    }
  };

  return (
    <AnimatePresence>
      {aberto && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md pointer-events-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Texto variant="titulo">Importar Leads</Texto>
                <button
                  onClick={onFechar}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {status === 'sucesso' ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full"
                  >
                    <CheckCircle size={48} />
                  </motion.div>
                  <Texto variant="corpo" className="font-medium">Importação concluída com sucesso!</Texto>
                </div>
              ) : (
                <div className="space-y-6">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center space-y-4 transition-all
                      ${isDragging 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
                      ${arquivo ? 'bg-slate-50 dark:bg-slate-800/50' : ''}
                    `}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".csv"
                      onChange={handleFileInput}
                    />
                    
                    {arquivo ? (
                      <>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <FileText size={32} />
                        </div>
                        <div className="text-center">
                          <Texto variant="corpo" className="font-medium block">{arquivo.name}</Texto>
                          <Texto variant="detalhe">{(arquivo.size / 1024).toFixed(1)} KB</Texto>
                        </div>
                        <button 
                          onClick={() => setArquivo(null)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remover arquivo
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <label htmlFor="file-upload" className="cursor-pointer group">
                            <Texto variant="corpo" className="font-medium block group-hover:text-blue-600 transition-colors">
                              Clique para selecionar ou arraste
                            </Texto>
                            <Texto variant="detalhe">Suporta arquivos .CSV (máx. 10MB)</Texto>
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  {status === 'erro' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-sm">
                      <AlertCircle size={16} />
                      {erroMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Botao
                      disabled={!arquivo || status === 'uploading'}
                      onClick={handleImportar}
                      className="w-full h-12 flex items-center justify-center gap-2"
                    >
                      {status === 'uploading' ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Iniciar Importação'
                      )}
                    </Botao>
                    <Texto variant="detalhe" className="text-center">
                      Formato: nome, email, cnpj, empresa, origem, serviço
                    </Texto>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);
};
