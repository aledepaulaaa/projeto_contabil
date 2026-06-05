import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('authStore Profile TDD', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it('deve armazenar email e nomeEmpresa no estado do usuario após login', () => {
    const store = useAuthStore.getState();
    const mockUser = {
      id: '123',
      identificador: 'admin',
      nome: 'Administrador',
      papel: 'ADMIN' as const,
      email: 'admin@test.com', // RED: Campo pode não estar na interface
      nomeEmpresa: 'Minha Empresa' // RED: Campo pode não estar na interface
    };

    // Simulando o login que aceita os novos campos
    // @ts-ignore - Ignorando erro de tipo para o teste RED
    store.login(mockUser, 'fake-token', 'tenant-1');

    const updatedUser = useAuthStore.getState().user;
    expect(updatedUser?.email).toBe('admin@test.com');
    expect(updatedUser?.nomeEmpresa).toBe('Minha Empresa');
  });
});
