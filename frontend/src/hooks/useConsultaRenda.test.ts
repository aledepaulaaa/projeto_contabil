import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useConsultaRenda } from './useConsultaRenda';
import SerproService from '../services/SerproService';

// Mock do SerproService
vi.mock('../services/SerproService', () => ({
  default: {
    consultarRenda: vi.fn(),
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

describe('useConsultaRenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com estado padrão vazio', () => {
    const { result } = renderHook(() => useConsultaRenda(), { wrapper: createWrapper() });

    expect(result.current.dadosRenda).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve consultar dados de renda com sucesso', async () => {
    const mockRenda = {
      titular: '12345678909',
      destinatario: '33683111000107',
      dataHoraRegistro: '2026-06-03T11:00:00',
      token: 'test-token-123',
      avisoLegal: 'Aviso Legal LGPD',
      dados: [
        { codigo: '1', texto: 'Rendimentos Recebidos de Pessoas Jurídicas', valor: '150000.00' },
      ],
    };

    vi.mocked(SerproService.consultarRenda).mockResolvedValue(mockRenda);

    const { result } = renderHook(() => useConsultaRenda(), { wrapper: createWrapper() });

    act(() => {
      result.current.consultar('test-token-123');
    });

    await waitFor(() => {
      expect(result.current.dadosRenda).toEqual(mockRenda);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erro na consulta', async () => {
    const errorMessage = 'Token de Autorização não encontrado';
    const mockError = {
      response: {
        data: {
          erro: errorMessage,
        },
      },
    };

    vi.mocked(SerproService.consultarRenda).mockRejectedValue(mockError);

    const { result } = renderHook(() => useConsultaRenda(), { wrapper: createWrapper() });

    act(() => {
      result.current.consultar('invalid-token');
    });

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.dadosRenda).toBeNull();
  });
});
