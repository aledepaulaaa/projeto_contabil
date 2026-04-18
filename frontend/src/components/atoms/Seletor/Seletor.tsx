import React from 'react';
import { theme } from '../../../theme';

interface Opcao {
  valor: string;
  rotulo: string;
}

interface SeletorProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  opcoes: Opcao[];
}

export const Seletor: React.FC<SeletorProps> = ({ label, id, opcoes, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        id={id}
        className={`w-full px-4 py-3 xs:py-2.5 xs:text-sm ${theme.glass.input} outline-none transition-all duration-200 bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl appearance-none cursor-pointer`}
        {...props}
      >
        <option value="" className="bg-slate-900">Selecione uma opção...</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor} className="bg-slate-900">
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
};
