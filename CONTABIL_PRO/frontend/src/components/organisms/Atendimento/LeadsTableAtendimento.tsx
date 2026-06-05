import React from 'react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { Card } from '../../atoms/Card/Card';
import { MessageSquare, Forward, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export interface LeadAtendimento {
  id: string;
  nome: string;
  empresa?: string;
  whatsapp: string;
  espera: string; // Ex: "5 min"
  status: 'esperando' | 'atendimento' | 'transferido';
  departamento: string;
}

// Mock de dados para Etapa 1
const mockLeads: LeadAtendimento[] = [
  { id: '1', nome: 'Roberto Silva', empresa: 'Biz Corp', whatsapp: '(11) 99887-7665', espera: '3 min', status: 'esperando', departamento: 'CONTABIL' },
  { id: '2', nome: 'Ana Santos', empresa: 'Tech Green', whatsapp: '(21) 98765-4321', espera: '12 min', status: 'esperando', departamento: 'FINANCEIRO' },
  { id: '3', nome: 'Cláudio Ferreira', whatsapp: '(19) 99123-4567', espera: '30 min', status: 'esperando', departamento: 'JURIDICO' },
];

interface LeadsTableAtendimentoProps {
  departamentoId?: string;
  onAtender: (lead: LeadAtendimento) => void;
  onTransferir: (lead: LeadAtendimento) => void;
  onCancelar: (lead: LeadAtendimento) => void;
}

export const LeadsTableAtendimento: React.FC<LeadsTableAtendimentoProps> = ({ 
  departamentoId, 
  onAtender, 
  onTransferir, 
  onCancelar 
}) => {
  const filteredLeads = departamentoId 
    ? mockLeads.filter(l => l.departamento === departamentoId)
    : mockLeads;

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">
                <Texto variant="label">Lead / Empresa</Texto>
              </th>
              <th className="px-6 py-4">
                <Texto variant="label">WhatsApp</Texto>
              </th>
              <th className="px-6 py-4">
                <Texto variant="label">Tempo de Espera</Texto>
              </th>
              <th className="px-6 py-4 text-right">
                <Texto variant="label">Ações de Atendimento</Texto>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Texto variant="corpo" className="text-slate-400 italic">Nenhum lead aguardando neste departamento.</Texto>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={lead.id} 
                  className="group hover:bg-blue-500/[0.02] dark:hover:bg-blue-500/[0.05] transition-colors border-b last:border-none border-slate-50 dark:border-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                        {lead.nome[0]}
                      </div>
                      <div className="flex flex-col">
                        <Texto variant="corpo" className="font-bold leading-tight">{lead.nome}</Texto>
                        <Texto variant="detalhe" className="text-slate-400 opacity-80">{lead.empresa || 'Pessoa Física'}</Texto>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Texto variant="detalhe" className="font-bold text-blue-500 dark:text-blue-400">{lead.whatsapp}</Texto>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Clock size={14} className={parseInt(lead.espera) > 15 ? 'text-rose-500' : 'text-slate-400'} />
                       <Texto variant="detalhe" className={`font-bold ${parseInt(lead.espera) > 15 ? 'text-rose-500' : 'text-slate-500'}`}>
                          {lead.espera}
                       </Texto>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Botao 
                        variant="primary" 
                        className="!w-auto !min-h-[36px] px-3 gap-2 text-xs"
                        onClick={() => onAtender(lead)}
                      >
                        <MessageSquare size={14} /> Atender
                      </Botao>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onTransferir(lead)}
                          className="p-2 hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                          title="Transferir"
                        >
                          <Forward size={16} />
                        </button>
                        <button 
                          onClick={() => onCancelar(lead)}
                          className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                          title="Encerrar"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
