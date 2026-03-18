import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';

export interface Documento {
  id: string;
  nomeOriginal: string;
  caminhoStorage: string;
  tipo: string;
  tamanho: number;
  criadoEm: string;
}

export const useDocumentos = () => {
  const { tenantId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: documentos, isLoading, error } = useQuery({
    queryKey: ['documentos', tenantId],
    queryFn: async () => {
      const response = await apiClient.get<Documento[]>('/api/documentos');
      return response.data;
    },
    enabled: !!tenantId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<Documento>('/api/documentos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos', tenantId] });
    },
  });

  return {
    documentos,
    isLoading,
    error,
    uploadDocumento: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
  };
};
