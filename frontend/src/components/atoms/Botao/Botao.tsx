import React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { theme } from '../../../theme';
import { Loader2 } from 'lucide-react';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
}

export const Botao: React.FC<BotaoProps> = ({ 
  children, 
  loading, 
  className = '', 
  disabled, 
  variant = 'primary',
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return 'bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-200';
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 border-none text-white font-bold';
      case 'primary':
      default:
        return theme.glass.buttonPrimary;
    }
  };

  return (
    <button
      className={`w-full flex items-center justify-center p-3 xs:p-2.5 text-base xs:text-sm min-h-[48px] xs:min-h-[44px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : children}
    </button>
  );
};
