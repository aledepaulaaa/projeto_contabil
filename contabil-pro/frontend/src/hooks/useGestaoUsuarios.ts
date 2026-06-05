import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/apiClient';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  departamentoId?: string;
  permissoes: string[];
  ativo: boolean;
}

export function useGestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const { empresaLocatariaId } = useAuthStore();

  const carregarUsuarios = useCallback(async () => {
    if (!empresaLocatariaId) return;
    setLoading(true);
    try {
      const resp = await apiClient.get<Usuario[]>('/api/usuarios', {
        headers: { 'X-EmpresaLocataria-Id': empresaLocatariaId }
      });
      setUsuarios(resp.data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaLocatariaId]);

  const convidarUsuario = async (dados: {
    email: string;
    nome: string;
    papel: string;
    departamentoId?: string;
    permissoes: string[];
  }) => {
    if (!empresaLocatariaId) return;
    setLoading(true);
    try {
      await apiClient.post('/api/usuarios/convidar', dados, {
        headers: { 'X-EmpresaLocataria-Id': empresaLocatariaId }
      });
      await carregarUsuarios();
      return true;
    } catch (err) {
      console.error('Erro ao convidar usuário:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removerUsuario = async (id: string) => {
    if (!empresaLocatariaId) return;
    setLoading(true);
    try {
      await apiClient.delete(`/api/usuarios/${id}`, {
        headers: { 'X-EmpresaLocataria-Id': empresaLocatariaId }
      });
      await carregarUsuarios();
      return true;
    } catch (err) {
      console.error('Erro ao remover usuário:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  return { usuarios, loading, carregarUsuarios, convidarUsuario, removerUsuario };
}
