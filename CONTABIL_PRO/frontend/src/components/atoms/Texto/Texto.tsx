import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TextoProps {
  children: React.ReactNode;
  variant?: 'titulo' | 'subtitulo' | 'corpo' | 'detalhe' | 'label';
  className?: string;
  as?: React.ElementType;
}

export const Texto: React.FC<TextoProps> = ({ 
  children, 
  variant = 'corpo', 
  className,
  as: Component = 'p'
}) => {
  const baseStyles = "transition-colors duration-300";
  
  const variants = {
    titulo: "text-2xl font-display font-bold text-text-main",
    subtitulo: "text-lg font-display font-semibold text-text-main",
    corpo: "text-sm text-text-main font-medium",
    detalhe: "text-[11px] text-text-secondary font-medium",
    label: "text-xs font-bold text-text-secondary uppercase tracking-wider"
  };

  const ResolvedComponent = variant === 'titulo' ? 'h2' : variant === 'subtitulo' ? 'h3' : Component;

  return (
    <ResolvedComponent className={cn(baseStyles, variants[variant], className)}>
      {children}
    </ResolvedComponent>
  );
};
