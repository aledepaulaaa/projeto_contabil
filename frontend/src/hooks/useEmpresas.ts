import { useState, useEffect } from 'react';
import type { Empresa } from '../consts/onboarding';
import { apiClient } from '../services/apiClient';

export const useEmpresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarEmpresas = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Empresa[]>('/api/empresas');
      setEmpresas(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      setError('Falha ao carregar lista de empresas.');
    } finally {
      setIsLoading(false);
    }
  };

  const criarEmpresa = async (nova: Partial<Empresa>) => {
    try {
      await apiClient.post('/api/empresas', nova);
      await carregarEmpresas();
      return true;
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      return false;
    }
  };

  const atualizarEmpresa = async (id: string, dados: Partial<Empresa>) => {
    try {
      await apiClient.put(`/api/empresas/${id}`, dados);
      await carregarEmpresas();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err);
      return false;
    }
  };

  const importarEmpresas = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      await apiClient.post('/api/empresas/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await carregarEmpresas();
      return true;
    } catch (err) {
      console.error('Erro ao importar empresas:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarEmpresas();
  }, []);

  return {
    empresas,
    isLoading,
    error,
    carregarEmpresas,
    criarEmpresa,
    atualizarEmpresa,
    importarEmpresas
  };
};
