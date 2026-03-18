import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'glass';
  className?: string;
  noPadding?: boolean;
  as?: any;
  [key: string]: any; // Allow other props like layoutId, transition, etc.
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  className,
  noPadding = false,
  as: Component = motion.div,
  ...props
}) => {
  const baseStyles = "rounded-2xl border transition-all duration-300 overflow-hidden";
  
  const variants = {
    default: "bg-surface-card border-slate-200 dark:border-slate-800/50 backdrop-blur-xl shadow-sm dark:shadow-none",
    flat: "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/30",
    glass: "glass-card"
  };

  return (
    <Component 
      className={cn(
        baseStyles, 
        variants[variant], 
        !noPadding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
