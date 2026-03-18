import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export const useRelatorios = () => {
  const exportarRelatorioMensal = useMutation({
    mutationFn: async ({ mes, ano }: { mes: number; ano: number }) => {
      const response = await apiClient.get('/api/relatorios/mensal', {
        params: { mes, ano },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `relatorio_${String(variables.mes).padStart(2, '0')}_${variables.ano}.pdf`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  return {
    exportarRelatorioMensal,
  };
};
