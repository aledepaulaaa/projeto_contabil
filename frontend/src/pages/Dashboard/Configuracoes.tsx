import React from 'react';
import { Settings, Bell, Globe, Shield, Wallet, FileSearch } from 'lucide-react';
import { Texto } from '../../components/atoms/Texto/Texto';
import { UploadArea } from '../../components/atoms/UploadArea/UploadArea';
import { GradeDocumentos } from '../../components/organisms/GradeDocumentos/GradeDocumentos';
import { useDocumentos } from '../../hooks/useDocumentos';

export const Configuracoes: React.FC = () => {
  const { documentos, isLoading, uploadDocumento, isUploading } = useDocumentos();

  const sections = [
    { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Gerencie alertas via E-mail e WhatsApp' },
    { id: 'regional', label: 'Regional & Idioma', icon: Globe, desc: 'Fuso horário e formatos de data' },
    { id: 'privacidade', label: 'Privacidade', icon: Shield, desc: 'Controle de visibilidade e auditoria' },
    { id: 'faturamento', label: 'Faturamento', icon: Wallet, desc: 'Histórico de pagamentos e faturas' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col gap-2">
        <Texto variant="titulo" className="flex items-center gap-3">
          <Settings className="text-blue-600 dark:text-blue-500" size={28} />
          Configurações do Sistema
        </Texto>
        <Texto variant="corpo" className="text-text-secondary">Personalize o comportamento e as integrações da sua empresa</Texto>
      </div>

      {/* Grid de Configurações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="p-2.5 w-fit bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 group-hover:text-blue-500 transition-colors">
                <section.icon size={20} />
              </div>
              <div>
                <Texto variant="corpo" className="font-bold">{section.label}</Texto>
                <Texto variant="detalhe" className="text-[10px] mt-0.5">{section.desc}</Texto>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de Homologação de Documentos (Movida de Rotinas) */}
      <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <Texto variant="subtitulo" className="flex items-center gap-3">
            <FileSearch size={22} className="text-blue-600 dark:text-blue-500" />
            Homologação de Guias (PDF)
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Carregue as guias geradas para validação e envio automático ao cliente</Texto>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UploadArea onFileSelect={uploadDocumento} isUploading={isUploading} />
          </div>
          <div className="lg:col-span-2">
            <GradeDocumentos documentos={documentos || []} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
