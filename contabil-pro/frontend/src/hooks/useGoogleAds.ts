import { useQuery } from '@tanstack/react-query';
import { GoogleAdsService } from '../services/GoogleAdsService';
import type { GoogleAdsStatusResponse } from '../services/GoogleAdsService';
import { useAuthStore } from '../store/authStore';

/**
 * Hook para gerenciar o estado da integração com Google Ads.
 */
export function useGoogleAds() {
  const { empresaLocatariaId } = useAuthStore();

  const { data, isLoading, refetch } = useQuery<GoogleAdsStatusResponse>({
    queryKey: ['google-ads-status', empresaLocatariaId],
    queryFn: () => GoogleAdsService.buscarStatus(empresaLocatariaId!),
    enabled: !!empresaLocatariaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const conectar = () => {
    if (empresaLocatariaId) {
      GoogleAdsService.conectar(empresaLocatariaId);
    }
  };

  return {
    isStatusLoading: isLoading,
    status: data,
    conectar,
    refreshStatus: refetch
  };
}
