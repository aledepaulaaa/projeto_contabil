import React from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';

export interface ColunaTabela<T> {
  chave: string;
  titulo: string;
  largura?: string; // ex: 'col-span-3'
  renderizar: (item: T) => React.ReactNode;
}

interface TabelaGenericaProps<T> {
  colunas: ColunaTabela<T>[];
  dados: T[];
  chaveUnica: (item: T) => string;
  vazio?: { icone: React.ReactNode; titulo: string; subtitulo: string };
  onClickLinha?: (item: T) => void;
  className?: string;
}

/**
 * Componente DRY para tabelas do sistema (Leads, Obrigações, Processos).
 * Recebe colunas e dados como props, mantendo o visual Glassmorphism consistente.
 * Segue o princípio DRY da Bíblia do Projeto (PROJETO_MASTER_INSTRUCTIONS.md).
 */
export function TabelaGenerica<T>({
  colunas,
  dados,
  chaveUnica,
  vazio,
  onClickLinha,
  className = ''
}: TabelaGenericaProps<T>) {
  const totalCols = colunas.length;

  if (dados.length === 0 && vazio) {
    return (
      <Card className={`p-8 flex flex-col items-center justify-center text-center gap-4 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10 transition-colors">
          {vazio.icone}
        </div>
        <div>
          <Texto variant="corpo" className="font-medium">{vazio.titulo}</Texto>
          <Texto variant="detalhe" className="mt-1">{vazio.subtitulo}</Texto>
        </div>
      </Card>
    );
  }

  return (
    <Card noPadding className={`w-full overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className={`grid grid-cols-${totalCols * 3} gap-4 p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 transition-colors hidden md:grid`}>
        {colunas.map(col => (
          <div key={col.chave} className={col.largura || `col-span-3`}>
            <Texto variant="label">{col.titulo}</Texto>
          </div>
        ))}
      </div>

      {/* Linhas */}
      <div className="flex flex-col w-full">
        {dados.map((item) => (
          <div
            key={chaveUnica(item)}
            onClick={() => onClickLinha?.(item)}
            className={`p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors grid grid-cols-1 md:grid-cols-${totalCols * 3} gap-4 items-center ${onClickLinha ? 'cursor-pointer' : ''}`}
          >
            {colunas.map(col => (
              <div key={col.chave} className={col.largura || `col-span-3`}>
                {col.renderizar(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
