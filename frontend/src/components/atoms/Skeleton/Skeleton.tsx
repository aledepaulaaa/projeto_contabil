import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

/**
 * Componente Atômico de Skeleton para estados de carregamento.
 * Segue o padrão Glassmorphism e animações suaves.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={`bg-white/10 rounded-lg shadow-inner border border-white/5 ${className}`}
    />
  );
};
