import React, { useState } from 'react';
import { Link } from 'wouter';
import { Botao } from '../../atoms/Botao/Botao';
import { EntradaTexto } from '../../atoms/EntradaTexto/EntradaTexto';
import { useAutenticacao } from '../../../hooks/useAutenticacao';

export const FormularioLogin: React.FC = () => {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const { handleLogin, loading } = useAutenticacao();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(identificador, senha);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 w-full xs:gap-4">
      <EntradaTexto
        id="identificador"
        label="Identificador de Acesso (ID da Empresa)"
        placeholder="id da empresa, email,cpf ou cnpj"
        value={identificador}
        onChange={(e) => setIdentificador(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1 w-full">
        <EntradaTexto
          id="senha"
          label="Sua Senha Mestra"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link
            to="/recuperar-senha"
            className="text-xs text-slate-400 hover:text-blue-400 transition-colors py-1"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <Botao type="submit" loading={loading} className="mt-2">
        Acessar Gestão Inteligente
      </Botao>
    </form>
  );
};
