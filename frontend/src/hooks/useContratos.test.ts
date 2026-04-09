import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useContratos } from './useContratos';
import ContratoService from '../services/ContratoService';

// Mock do ContratoService
vi.mock('../services/ContratoService', () => ({
  default: {
    listarContratos: vi.fn(),
    ativarContrato: vi.fn(),
    cancelarContrato: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useContratos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com lista vazia durante o carregamento', () => {
    vi.mocked(ContratoService.listarContratos).mockResolvedValue([]);
    const { result } = renderHook(() => useContratos(), { wrapper: createWrapper() });

    expect(result.current.contratos).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('deve carregar contratos do serviço', async () => {
    const mockContratos = [
      {
        id: '1',
        leadId: 'lead-1',
        status: 'ATIVO',
        nomeContato: 'João',
        emailContato: 'joao@test.com',
        nomeEmpresa: 'Empresa X',
        leadStatus: 'FECHAMENTO',
        urlDocumentoZapSign: 'https://zapsign.com/doc/1',
        motivoCancelamento: null,
        criadoEm: '2026-01-01T00:00:00',
        atualizadoEm: null,
      },
      {
        id: '2',
        leadId: 'lead-2',
        status: 'GERANDO',
        nomeContato: 'Maria',
        emailContato: 'maria@test.com',
        nomeEmpresa: 'Empresa Y',
        leadStatus: 'FECHAMENTO',
        urlDocumentoZapSign: null,
        motivoCancelamento: null,
        criadoEm: '2026-01-02T00:00:00',
        atualizadoEm: null,
      },
    ];

    vi.mocked(ContratoService.listarContratos).mockResolvedValue(mockContratos);

    const { result } = renderHook(() => useContratos(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.contratos).toHaveLength(2);
    });

    expect(result.current.contratos[0].nomeContato).toBe('João');
    expect(result.current.contratos[1].status).toBe('GERANDO');
    expect(result.current.isLoading).toBe(false);
  });

  it('deve expor funções de ativação e cancelamento', () => {
    vi.mocked(ContratoService.listarContratos).mockResolvedValue([]);
    const { result } = renderHook(() => useContratos(), { wrapper: createWrapper() });

    expect(typeof result.current.ativarContrato).toBe('function');
    expect(typeof result.current.cancelarContrato).toBe('function');
    expect(typeof result.current.refreshContratos).toBe('function');
  });
});
