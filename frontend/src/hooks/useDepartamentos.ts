import { useMemo, useState, useEffect, useCallback } from 'react';
import { DepartamentoService, type DepartamentoResponse as Departamento } from '../services/DepartamentoService';
import { useAuthStore } from '../store/authStore';

export interface DepartamentoConfig {
  id: string;
  label: string;
  color: string;
  bgLight: string;
}

const DEPTOS: Record<string, DepartamentoConfig> = {
  'COMERCIAL': {
    id: 'COMERCIAL',
    label: 'COMERCIAL',
    color: 'text-blue-600',
    bgLight: 'bg-blue-500/10 border-blue-500/20'
  },
  'FISCAL': {
    id: 'FISCAL',
    label: 'FISCAL',
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-500/10 border-emerald-500/20'
  },
  'CONTABIL': {
    id: 'CONTABIL',
    label: 'CONTÁBIL',
    color: 'text-amber-600',
    bgLight: 'bg-amber-500/10 border-amber-500/20'
  },
  'ABERTURA': {
    id: 'ABERTURA',
    label: 'ABERTURA',
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-500/10 border-indigo-500/20'
  },
  'LEGALIZACAO': {
    id: 'LEGALIZACAO',
    label: 'LEGALIZAÇÃO',
    color: 'text-purple-600',
    bgLight: 'bg-purple-500/10 border-purple-500/20'
  },
};

export { type Departamento };

export const useDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const { empresaLocatariaId } = useAuthStore();

  const carregarDepartamentos = useCallback(async () => {
    if (!empresaLocatariaId) return;
    setLoading(true);
    try {
      const data = await DepartamentoService.listar();
      setDepartamentos(data);
    } catch (err) {
      console.error('Erro ao listar departamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaLocatariaId]);

  const criarDepartamento = async (nome: string, descricao?: string) => {
    setLoading(true);
    try {
      await DepartamentoService.criar(nome, descricao);
      await carregarDepartamentos();
      return true;
    } catch (err) {
      console.error('Erro ao criar departamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const excluirDepartamento = async (id: string) => {
    setLoading(true);
    try {
      await DepartamentoService.excluir(id);
      await carregarDepartamentos();
      return true;
    } catch (err) {
      console.error('Erro ao excluir departamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDepartamentos();
  }, [carregarDepartamentos]);

  const getDeptoInfo = (deptoIdOrName: string | null | any): DepartamentoConfig => {
    if (!deptoIdOrName) return { id: '', label: 'GERAL', color: 'text-slate-600', bgLight: 'bg-slate-500/10' };

    // Tenta encontrar pelo ID exato ou pela chave
    const key = deptoIdOrName.toUpperCase();
    
    // Tenta encontrar na lista de departamentos do estado
    const deptoDinamico = departamentos.find(d => d.id === deptoIdOrName || d.nome.toUpperCase() === key);
    if (deptoDinamico) {
      return { 
        id: deptoDinamico.id, 
        label: deptoDinamico.nome, 
        color: 'text-indigo-600', 
        bgLight: 'bg-indigo-500/10 border-indigo-500/20' 
      };
    }

    // Fallback para dictionary estático ou UUID (se falhar em resolver)
    return DEPTOS[key] || { id: deptoIdOrName, label: key, color: 'text-slate-600', bgLight: 'bg-slate-500/10' };
  };

  return { 
    departamentos, 
    loading, 
    carregarDepartamentos, 
    criarDepartamento, 
    excluirDepartamento,
    getDeptoInfo 
  };
};
