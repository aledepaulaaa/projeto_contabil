import { useState } from 'react';
import { useLocation } from 'wouter';
import { LeadService } from '../services/LeadService';
import { useAuthStore } from '../store/authStore';
import { useGlobalErrorStore } from '../store/globalErrorStore';

export function useCadastro() {
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuthStore();
  const { setError, clearError } = useGlobalErrorStore();

  const handleCadastro = async (nome: string, email: string, cnpj: string, senha: string) => {
    setLoading(true);
    clearError();
    try {
      await LeadService.criarConta({ nome, email, cnpj, senha });
      
      // Simula login automático após cadastro para o Dashboard
      // Em uma integração real, o backend poderia retornar as credenciais ou 
      // redirecionar para o login. Aqui seguimos a meta de ir para o dashboard.
      login('fake-jwt-new-account', cnpj);
      
      setLocation('/dashboard');
      return true;
    } catch (e: any) {
      setError('Erro ao realizar cadastro. Verifique os dados ou CNPJ.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleCadastro };
}
