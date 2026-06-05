import React from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface LinkTextoProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export const LinkTexto: React.FC<LinkTextoProps> = ({ children, className = '', ...props }) => {
  return (
    <a
      className={`text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium border-b border-transparent hover:border-blue-300 ${className}`}
      {...props}
    >
      {children}
    </a>
  );
};
