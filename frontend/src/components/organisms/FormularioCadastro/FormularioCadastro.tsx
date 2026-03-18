import React, { useState } from 'react';
import { Botao } from '../../atoms/Botao/Botao';
import { EntradaTexto } from '../../atoms/EntradaTexto/EntradaTexto';
import { EntradaMascara } from '../../atoms/EntradaMascara/EntradaMascara';
import { useCadastro } from '../../../hooks/useCadastro';
import { useResolucao } from '../../../contexts/ResolucaoContext';

export const FormularioCadastro: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  
  const { handleCadastro, loading } = useCadastro();
  const { isMobile } = useResolucao();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCadastro(nome, email, cnpj, senha);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <EntradaTexto
          id="nome"
          label="Nome Completo / Empresa"
          placeholder="Seu nome ou Razão Social"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <EntradaMascara
          id="cnpj"
          label="CNPJ / CPF"
          placeholder="000.000.000-00"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          required
        />
      </div>

      <EntradaTexto
        id="email"
        label="E-mail Corporativo"
        type="email"
        placeholder="contato@empresa.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <EntradaTexto
        id="senha"
        label="Crie sua Senha"
        type="password"
        placeholder="••••••••"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
      />

      <Botao type="submit" loading={loading} className="mt-4">
        Finalizar Cadastro Gratuito
      </Botao>
    </form>
  );
};
