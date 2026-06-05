import React from 'react';
import { Settings, Bell, Globe, Shield, Wallet, FileSearch, Users, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { GestaoUsuariosModal } from '../../components/organisms/Gestao/GestaoUsuariosModal';
import { Texto } from '../../components/atoms/Texto/Texto';
import { UploadArea } from '../../components/atoms/UploadArea/UploadArea';
import { GradeDocumentos } from '../../components/organisms/GradeDocumentos/GradeDocumentos';
import { useDocumentos } from '../../hooks/useDocumentos';

export const Configuracoes: React.FC = () => {
  const { documentos, isLoading, uploadDocumento, isUploading } = useDocumentos();
  const { papel } = useAuthStore();
  const [modalUsuarioAberto, setModalUsuarioAberto] = React.useState(false);
  const [waAtivo, setWaAtivo] = React.useState(true);
  const [emailAtivo, setEmailAtivo] = React.useState(true);

  const podeGerenciarEquipe = papel === 'ADMIN' || papel === 'GESTOR';

  const sections = [
    { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Gerencie alertas via E-mail e WhatsApp' },
    { id: 'regional', label: 'Regional & Idioma', icon: Globe, desc: 'Fuso horário e formatos de data' },
    { id: 'privacidade', label: 'Privacidade', icon: Shield, desc: 'Controle de visibilidade e auditoria' },
    { id: 'faturamento', label: 'Faturamento', icon: Wallet, desc: 'Histórico de pagamentos e faturas' },
    ...(podeGerenciarEquipe ? [{
      id: 'equipe',
      label: 'Gestão da Equipe',
      icon: Users,
      desc: 'Membros, papéis e departamentos',
      action: () => setModalUsuarioAberto(true)
    }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
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
          <div
            key={section.id}
            onClick={() => (section as any).action?.()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
          >
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

      {/* Seção de Automação */}
      <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <Texto variant="subtitulo" className="flex items-center gap-3">
            <Bell size={22} className="text-blue-600 dark:text-blue-500" />
            Preferências de Automação
          </Texto>
          <Texto variant="corpo" className="text-text-secondary mt-1">Configure o disparo automático de mensagens e e-mails de status</Texto>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                   <MessageSquare size={24} />
                </div>
                <div>
                   <Texto variant="corpo" className="font-bold">WhatsApp Automático</Texto>
                   <Texto variant="detalhe" className="text-[10px]">Notifica leads sobre mudanças de status</Texto>
                </div>
              </div>
              <button 
                onClick={() => setWaAtivo(!waAtivo)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${waAtivo ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${waAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>

           <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                   <Bell size={24} />
                </div>
                <div>
                   <Texto variant="corpo" className="font-bold">E-mail Automático</Texto>
                   <Texto variant="detalhe" className="text-[10px]">Envia cópia dos alertas por e-mail</Texto>
                </div>
              </div>
              <button 
                onClick={() => setEmailAtivo(!emailAtivo)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${emailAtivo ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${emailAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
        </div>
      </div>

      {/* Seção de Homologação de Documentos */}
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

      <GestaoUsuariosModal
        isOpen={modalUsuarioAberto}
        onClose={() => setModalUsuarioAberto(false)}
      />
    </div>
  );
};
