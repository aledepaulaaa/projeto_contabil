import { renderHook, act } from '@testing-library/react';
import { useNotificacoes } from './useNotificacoes';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Client } from '@stomp/stompjs';

// Mock STOMP Client
vi.mock('@stomp/stompjs', () => {
  const ClientMock = vi.fn();
  ClientMock.prototype.activate = vi.fn();
  ClientMock.prototype.deactivate = vi.fn();
  ClientMock.prototype.subscribe = vi.fn();
  return { Client: ClientMock };
});

// Mock SockJS
vi.mock('sockjs-client', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {};
    }),
  };
});

describe('useNotificacoes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com lista vazia e desconectado', () => {
    const { result } = renderHook(() => useNotificacoes(null));
    expect(result.current.notificacoes).toEqual([]);
    expect(result.current.conectado).toBe(false);
  });

  it('deve ativar o cliente STOMP quando o tenantId é fornecido', () => {
    renderHook(() => useNotificacoes('tenant-123'));
    const clientInstance = vi.mocked(Client).mock.instances[0];
    expect(clientInstance.activate).toHaveBeenCalled();
  });

  it('deve limpar notificações quando limparNotificacoes é chamado', () => {
    const { result } = renderHook(() => useNotificacoes('tenant-123'));
    
    act(() => {
      result.current.limparNotificacoes();
    });

    expect(result.current.notificacoes).toEqual([]);
  });
});
