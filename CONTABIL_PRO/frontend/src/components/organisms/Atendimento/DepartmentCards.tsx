import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Wallet, Scale, MessageCircle } from 'lucide-react';
import { Card } from '../../atoms/Card/Card';
import { Texto } from '../../atoms/Texto/Texto';

const departamentos = [
  { id: 'CONTABIL', label: 'Contábil', icon: FileText, color: 'text-blue-500', count: 0 },
  { id: 'FINANCEIRO', label: 'Financeiro', icon: Wallet, color: 'text-emerald-500', count: 0 },
  { id: 'JURIDICO', label: 'Jurídico', icon: Scale, color: 'text-purple-500', count: 0 },
  { id: 'SUPORTE', label: 'Dúvidas/Suporte', icon: MessageCircle, color: 'text-amber-500', count: 0 },
];

interface DepartmentCardsProps {
  onSelect: (id: string) => void;
  selectedId?: string;
}

export const DepartmentCards: React.FC<DepartmentCardsProps> = ({ onSelect, selectedId }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {departamentos.map((dept) => {
        const Icon = dept.icon;
        const isActive = selectedId === dept.id;

        return (
          <motion.div
            key={dept.id}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(dept.id)}
            className="cursor-pointer"
          >
            <Card 
              className={`p-5 transition-all group relative overflow-hidden h-full border-2 ${
                isActive 
                  ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' 
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
              }`}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 blur-2xl rounded-full -mr-8 -mt-8 ${dept.color.replace('text', 'bg')}`} />
              
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${dept.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col items-end">
                    <Texto variant="titulo" className="text-xl leading-none">{dept.count}</Texto>
                    <Texto variant="detalhe" className="text-[10px] uppercase font-bold text-slate-400">Leads</Texto>
                </div>
              </div>

              <Texto variant="detalhe" className={`font-bold uppercase tracking-wider ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                {dept.label}
              </Texto>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
