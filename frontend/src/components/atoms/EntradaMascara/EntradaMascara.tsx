import React, { useState, useEffect } from 'react';
import type { InputHTMLAttributes } from 'react';
import { theme } from '../../../theme';

interface EntradaMascaraProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const EntradaMascara: React.FC<EntradaMascaraProps> = ({ label, id, value, onChange, ...props }) => {
  const [valorFormatado, setValorFormatado] = useState(String(value || ''));

  const aplicarMascara = (v: string) => {
    // Remove tudo que não é dígito
    const digitos = v.replace(/\D/g, '').slice(0, 14);
    
    if (digitos.length <= 11) {
      // CPF: 000.000.000-00
      return digitos
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0001-00
      return digitos
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = aplicarMascara(e.target.value);
    setValorFormatado(formatted);

    // Passamos o valor limpo para o pai, simulando o evento
    if (onChange) {
      const event = {
        ...e,
        target: {
          ...e.target,
          value: rawValue,
          id: id || ''
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setValorFormatado(aplicarMascara(String(value)));
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        value={valorFormatado}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 xs:py-2.5 xs:text-sm ${theme.glass.input} outline-none transition-all duration-200 bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl`}
        {...props}
      />
    </div>
  );
};
