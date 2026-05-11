import React, { useState, useEffect } from 'react';
import { Sparkles, Edit3, Save, X, Wand2 } from 'lucide-react';
import { Card } from '../../atoms/Card/Card';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';

interface ResumoIAPanelProps {
  resumo: string;
  onSave: (novoResumo: string) => Promise<void>;
}

export const ResumoIAPanel: React.FC<ResumoIAPanelProps> = ({ resumo, onSave }) => {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(resumo);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTexto(resumo);
  }, [resumo]);

  const handleSave = async () => {
    setSalvando(true);
    try {
      await onSave(texto);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  };

  const formatarResumo = (txt: string) => {
    // Simples formatador de negrito e listas para o resumo
    return txt
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600 dark:text-blue-400">$1</strong>')
      .replace(/### (.*?)\n/g, '<h3 class="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2 mt-4 first:mt-0">$1</h3>')
      .replace(/ - (.*?)\n/g, ' • $1\n');
  };

  return (
    <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-900/10 shadow-xl">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 shadow-lg shadow-blue-600/20 rounded-xl text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <Texto variant="subtitulo" className="text-blue-900 dark:text-blue-100 font-black">
              Direcionamento da IA
            </Texto>
            <Texto variant="detalhe" className="opacity-50">Estratégia comercial & técnica</Texto>
          </div>
        </div>
        
        {!editando ? (
          <Botao 
            variant="outline" 
            size="sm" 
            className="h-9 flex items-center gap-2 border-blue-500/30 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            onClick={() => setEditando(true)}
          >
            <Edit3 size={14} />
            Editar
          </Botao>
        ) : (
          <div className="flex items-center gap-2">
             <Botao 
              variant="outline" 
              size="sm" 
              className="text-slate-500 border-slate-200"
              onClick={() => { setEditando(false); setTexto(resumo); }}
              disabled={salvando}
            >
              <X size={14} />
            </Botao>
            <Botao 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 px-4 bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              loading={salvando}
            >
              <Save size={14} />
              Salvar
            </Botao>
          </div>
        )}
      </div>

      <div className="relative group">
        {editando ? (
          <textarea
            className="w-full h-[320px] p-5 bg-white dark:bg-slate-950 border border-blue-300 dark:border-blue-500/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono leading-relaxed shadow-inner"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        ) : (
          <div className="bg-white/60 dark:bg-slate-950/40 backdrop-blur-md p-6 rounded-3xl border border-white dark:border-white/5 shadow-2xl shadow-blue-900/5">
            <div 
              className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-2"
              dangerouslySetInnerHTML={{ __html: formatarResumo(resumo || "Analisando dados do cliente...") }}
            />
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-60">
              <Wand2 size={12} />
              Inteligência de Adoção Ativa
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
