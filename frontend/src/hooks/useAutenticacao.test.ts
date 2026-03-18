import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutenticacao } from './useAutenticacao';
import { AutenticacaoService } from '../services/AutenticacaoService';
import { useAuthStore } from '../store/authStore';
import { useGlobalErrorStore } from '../store/globalErrorStore';

import { AxiosError } from 'axios';

vi.mock('../services/AutenticacaoService');

describe('useAutenticacao Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    useGlobalErrorStore.getState().clearError();
  });

  it('deve realizar login com sucesso e atualizar authStore', async () => {
    const mockReponse = { token: 'jwt.123', tenantId: 'tenant-1' };
    vi.mocked(AutenticacaoService.login).mockResolvedValue(mockReponse);

    const { result } = renderHook(() => useAutenticacao());

    let actResult;
    await act(async () => {
      actResult = await result.current.handleLogin('tenant-1', 'senha');
    });

    expect(actResult).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('jwt.123');
  });

  it('deve emitir setError no limit rate (429)', async () => {
    const err = new AxiosError('Rate limit', '429', undefined, {}, { status: 429, data: {}, statusText: 'Too Many Requests', headers: {}, config: {} as any });
    vi.mocked(AutenticacaoService.login).mockRejectedValue(err);

    const { result } = renderHook(() => useAutenticacao());

    await act(async () => {
      await result.current.handleLogin('tenant-1', 'senha');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useGlobalErrorStore.getState().hasError).toBe(true);
    expect(useGlobalErrorStore.getState().code).toBe(429);
  });
});
