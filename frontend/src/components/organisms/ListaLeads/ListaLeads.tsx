import React from 'react';
import { motion } from 'framer-motion';
import { useLeads } from '../../../hooks/useLeads';
import { useResolucao } from '../../../contexts/ResolucaoContext';
import { Skeleton } from '../../atoms/Skeleton/Skeleton';
import { RefreshCw, PlayCircle, Building2, UserCircle, CheckCircle } from 'lucide-react';
import { LeadService } from '../../../services/LeadService';
import { useQueryClient } from '@tanstack/react-query';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';

export const ListaLeads: React.FC = () => {
  const { leads, isLoading, refreshLeads } = useLeads();
  const { isMobile } = useResolucao();
  const queryClient = useQueryClient();

  const handleSincronizar = async (id: string) => {
    try {
      await LeadService.sincronizarERP(id);
      refreshLeads();
      queryClient.invalidateQueries({ queryKey: ['obrigacoes'] });
    } catch (error) {
      console.error('Falha ao sincronizar lead com o ERP', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-8 w-full transition-colors">
        <Texto variant="subtitulo" className="flex items-center gap-2">
          Leads Recentes <Skeleton className="w-5 h-5 rounded-full" />
        </Texto>
        <Card noPadding className="w-full overflow-hidden">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 border-b border-slate-100 dark:border-white/5 flex gap-4 transition-colors">
              <Skeleton className="h-12 w-full max-w-[200px]" />
              {!isMobile && <Skeleton className="h-12 flex-1" />}
              <Skeleton className="h-12 w-24" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  const isEmpty = !leads || leads.length === 0;

  return (
    <div className="flex flex-col gap-4 mt-8 w-full transition-colors">
      <div className="flex justify-between items-center">
        <Texto variant="subtitulo" className="flex items-center gap-2">
          Leads Recentes
          <Texto variant="detalhe" className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/20">
            {leads?.length || 0}
          </Texto>
        </Texto>
        <button 
          onClick={() => refreshLeads()} 
          className="p-2 rounded-xl bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 text-text-secondary hover:text-text-main"
          title="Atualizar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isEmpty ? (
        <Card className="p-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10 transition-colors">
            <Building2 className="w-8 h-8 text-blue-600/40 dark:text-blue-500/40" />
          </div>
          <div>
            <Texto variant="corpo" className="font-medium">Nenhum Lead Encontrado</Texto>
            <Texto variant="detalhe" className="mt-1">Aguardando novos cadastros pelo Onboarding.</Texto>
          </div>
        </Card>
      ) : (
        <Card noPadding className="w-full overflow-hidden flex flex-col">
          {/* Header da Tabela (Oculto no Mobile) */}
          {!isMobile && (
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 transition-colors">
              <div className="col-span-3"><Texto variant="label">Nome / Empresa</Texto></div>
              <div className="col-span-4"><Texto variant="label">E-mail Corporativo</Texto></div>
              <div className="col-span-2"><Texto variant="label">Status</Texto></div>
              <div className="col-span-3 text-right"><Texto variant="label">Ação Conta Azul</Texto></div>
            </div>
          )}

          {/* Lista de Itens */}
          <div className="flex flex-col w-full">
            {leads?.map((lead, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={lead.id} 
                role="row"
                className={`p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                  isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-12 gap-4 items-center'
                }`}
              >
                {/* Nome e Empresa */}
                <div role="cell" className={`${isMobile ? 'flex flex-col' : 'col-span-3'}`}>
                  <div className="flex justify-between items-start w-full transition-colors">
                    <Texto variant="corpo" className="font-medium flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-text-secondary" />
                      {lead.nomeContato}
                    </Texto>
                    {/* Status inline no Mobile */}
                    {isMobile && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors">
                        {lead.status}
                      </span>
                    )}
                  </div>
                  <Texto variant="detalhe" className="mt-1 ml-6">{lead.nomeEmpresa}</Texto>
                </div>

                {/* E-mail */}
                <div role="cell" className={`${isMobile ? 'ml-6' : 'col-span-4'}`}>
                  <Texto variant="corpo" className="text-sm">{lead.email}</Texto>
                </div>

                {/* Status (Desktop) */}
                {!isMobile && (
                  <div role="cell" className="col-span-2">
                    <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap transition-colors">
                      {lead.status}
                    </span>
                  </div>
                )}

                {/* Ações ERP */}
                <div role="cell" className={`${isMobile ? 'mt-2' : 'col-span-3 text-right flex justify-end'}`}>
                  <button
                    onClick={() => handleSincronizar(lead.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                      lead.status === 'CONVERTIDO' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 cursor-default shadow-none' 
                        : 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600/40'
                    } ${isMobile ? 'w-full justify-center' : ''}`}
                    disabled={lead.status === 'CONVERTIDO'}
                  >
                    {lead.status === 'CONVERTIDO' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Conta Azul Sync
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" /> Enviar p/ ERP
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
