import { useQuery } from '@tanstack/react-query';
import { GoogleAdsService } from '../services/GoogleAdsService';
import type { GoogleAdsStatusResponse } from '../services/GoogleAdsService';
import { useAuthStore } from '../store/authStore';

/**
 * Hook para gerenciar o estado da integração com Google Ads.
 */
export function useGoogleAds() {
  const { tenantId } = useAuthStore();

  const { data, isLoading, refetch } = useQuery<GoogleAdsStatusResponse>({
    queryKey: ['google-ads-status', tenantId],
    queryFn: () => GoogleAdsService.buscarStatus(tenantId!),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const conectar = () => {
    if (tenantId) {
      GoogleAdsService.conectar(tenantId);
    }
  };

  return {
    isStatusLoading: isLoading,
    status: data,
    conectar,
    refreshStatus: refetch
  };
}
