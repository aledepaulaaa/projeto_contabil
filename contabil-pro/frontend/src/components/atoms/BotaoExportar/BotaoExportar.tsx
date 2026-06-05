import React from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BotaoExportarProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
}

export const BotaoExportar: React.FC<BotaoExportarProps> = ({ 
  onClick, 
  isLoading = false,
  label = "Exportar PDF" 
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        bg-white/10 backdrop-blur-md border border-white/20
        text-white font-medium transition-all
        hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span>{isLoading ? "Gerando..." : label}</span>
    </motion.button>
  );
};
