import React, { useState } from 'react';
import { User, Mail, Building, Camera, Save, Loader2 } from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { useAuthStore } from '../../store/authStore';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';

export const Perfil: React.FC = () => {
  const { tenantId } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: 'Usuário Master',
    email: 'admin@projetocontabil.com.br',
    empresa: 'Minha Contabilidade LTDA'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Perfil atualizado com sucesso (Simulação)');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <Texto variant="titulo" className="flex items-center gap-3">
          <User className="text-blue-600 dark:text-blue-500" size={28} />
          Meu Perfil
        </Texto>
        <Texto variant="corpo" className="text-text-secondary mt-1">Gerencie suas informações pessoais e de acesso</Texto>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="md:col-span-1 space-y-4">
          <Card className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-500 transition-all shadow-lg active:scale-95 z-10">
                <Camera size={18} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <Texto variant="corpo" className="mt-4 font-bold">{formData.nome}</Texto>
            <Texto variant="detalhe" className="mt-1 uppercase font-bold scale-90">{tenantId?.substring(0, 12)}</Texto>
          </Card>
        </div>

        {/* Form Section */}
        <Card className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Texto variant="label" className="flex items-center gap-2">
                <User size={14} />
                Nome Completo
              </Texto>
              <input 
                type="text" 
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-text-secondary"
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Texto variant="label" className="flex items-center gap-2">
                <Mail size={14} />
                E-mail
              </Texto>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-text-secondary"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Texto variant="label" className="flex items-center gap-2">
                <Building size={14} />
                Empresa (Locatário)
              </Texto>
              <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 rounded-xl py-3 px-4 flex items-center justify-between text-text-secondary transition-colors">
                 <Texto variant="corpo">{formData.empresa}</Texto>
                 <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 font-bold uppercase tracking-tight transition-colors">Somente Leitura</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Botao 
              onClick={handleSave}
              loading={loading}
              className="md:w-auto px-10 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Perfil
            </Botao>
          </div>
        </Card>
      </div>
    </div>
  );
};
