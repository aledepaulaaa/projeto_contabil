import { create } from 'zustand';

interface AuthState {
  token: string | null;
  empresaLocatariaId: string | null;
  papel: string | null;
  permissoes: string[];
  departamentoId: string | null;
  departamentoNome: string | null;
  usuarioId: string | null;
  user: {
    nome?: string;
    email?: string;
    nomeEmpresa?: string;
    papel: string;
    empresaLocatariaId: string;
    usuarioId: string;
  } | null;
  isAuthenticated: boolean;
  login: (data: { 
    token: string, 
    empresaLocatariaId: string, 
    papel: string, 
    permissoes: string[], 
    departamentoId?: string,
    departamentoNome?: string,
    usuarioId: string,
    nome?: string,
    email?: string,
    nomeEmpresa?: string
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  empresaLocatariaId: localStorage.getItem('empresaLocatariaId'),
  papel: localStorage.getItem('papel'),
  permissoes: JSON.parse(localStorage.getItem('permissoes') || '[]'),
  departamentoId: localStorage.getItem('departamentoId'),
  departamentoNome: localStorage.getItem('departamentoNome'),
  usuarioId: localStorage.getItem('usuarioId'),
  user: localStorage.getItem('token') ? {
    nome: localStorage.getItem('nomeUsuario') || undefined,
    email: localStorage.getItem('emailUsuario') || undefined,
    nomeEmpresa: localStorage.getItem('nomeEmpresa') || undefined,
    papel: localStorage.getItem('papel') || '',
    empresaLocatariaId: localStorage.getItem('empresaLocatariaId') || '',
    usuarioId: localStorage.getItem('usuarioId') || ''
  } : null,
  isAuthenticated: !!localStorage.getItem('token'),
  login: (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('empresaLocatariaId', data.empresaLocatariaId);
    localStorage.setItem('papel', data.papel);
    localStorage.setItem('usuarioId', data.usuarioId);
    localStorage.setItem('permissoes', JSON.stringify(data.permissoes));
    if (data.departamentoId) localStorage.setItem('departamentoId', data.departamentoId);
    if (data.departamentoNome) localStorage.setItem('departamentoNome', data.departamentoNome);
    if (data.nome) localStorage.setItem('nomeUsuario', data.nome);
    if (data.email) localStorage.setItem('emailUsuario', data.email);
    if (data.nomeEmpresa) localStorage.setItem('nomeEmpresa', data.nomeEmpresa);
    
    set({ 
      token: data.token, 
      empresaLocatariaId: data.empresaLocatariaId, 
      papel: data.papel,
      usuarioId: data.usuarioId,
      permissoes: data.permissoes,
      departamentoId: data.departamentoId || null,
      departamentoNome: data.departamentoNome || null,
      user: {
        nome: data.nome,
        email: data.email,
        nomeEmpresa: data.nomeEmpresa,
        papel: data.papel,
        empresaLocatariaId: data.empresaLocatariaId,
        usuarioId: data.usuarioId
      },
      isAuthenticated: true 
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('empresaLocatariaId');
    localStorage.removeItem('papel');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('permissoes');
    localStorage.removeItem('departamentoId');
    localStorage.removeItem('nomeUsuario');
    localStorage.removeItem('emailUsuario');
    localStorage.removeItem('nomeEmpresa');
    localStorage.removeItem('departamentoNome');
    set({ 
      token: null, 
      empresaLocatariaId: null, 
      papel: null,
      usuarioId: null,
      permissoes: [],
      departamentoId: null,
      departamentoNome: null,
      user: null,
      isAuthenticated: false 
    });
  },
}));
