import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  Users, 
  MapPin, 
  FileText, 
  Plus, 
  Trash2, 
  Save,
  Globe
} from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { Card } from '../../atoms/Card/Card';
import { EntradaTexto } from '../../atoms/EntradaTexto/EntradaTexto';
import { Seletor } from '../../atoms/Seletor/Seletor';
import type { Empresa, ContatoEmpresa, EnderecoEmpresa, RegimeTributario } from '../../../consts/onboarding';

interface ModalCadastroEmpresaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (empresa: Partial<Empresa>) => void;
  initialData?: Empresa | null;
}

type Tab = 'dados' | 'contatos' | 'enderecos' | 'obrigacoes' | 'extras';

export const ModalCadastroEmpresa: React.FC<ModalCadastroEmpresaProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dados');
  
  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Empresa>>({
    identificadorInterno: '',
    razaoSocial: '',
    nomeFantasia: '',
    identificacao: '',
    regimeTributario: 'SIMPLES',
    ativa: true,
    contatos: [],
    enderecos: [],
    tags: []
  });

  const [contatos, setContatos] = useState<Partial<ContatoEmpresa>[]>([]);
  const [enderecos, setEnderecos] = useState<Partial<EnderecoEmpresa>[]>([]);

  // Sincronizar dados quando entrar em modo edição
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        id: initialData.id,
        identificadorInterno: initialData.identificadorInterno,
        razaoSocial: initialData.razaoSocial,
        nomeFantasia: initialData.nomeFantasia,
        identificacao: initialData.identificacao,
        regimeTributario: initialData.regimeTributario,
        ativa: initialData.ativa,
        tags: initialData.tags || []
      });
      setContatos(initialData.contatos || []);
      setEnderecos(initialData.enderecos || []);
    } else if (!isOpen) {
      // Limpar formulário ao fechar
      setFormData({
        identificadorInterno: '',
        razaoSocial: '',
        nomeFantasia: '',
        identificacao: '',
        regimeTributario: 'SIMPLES',
        ativa: true,
        contatos: [],
        enderecos: [],
        tags: []
      });
      setContatos([]);
      setEnderecos([]);
      setActiveTab('dados');
    }
  }, [initialData, isOpen]);

  const handleAddContato = () => {
    setContatos([...contatos, { id: crypto.randomUUID(), nome: '', cargo: '', departamento: '', celular: '', email: '' }]);
  };

  const handleRemoveContato = (id: string) => {
    setContatos(contatos.filter(c => c.id !== id));
  };

  const handleAddEndereco = () => {
    setEnderecos([...enderecos, { 
      id: crypto.randomUUID(), 
      logradouro: '', 
      numero: '', 
      cep: '', 
      bairro: '', 
      cidade: '', 
      uf: '', 
      isentoIcms: false 
    }]);
  };

  const handleRemoveEndereco = (id: string) => {
    setEnderecos(enderecos.filter(e => e.id !== id));
  };

  const handleSave = () => {
    onSave({ ...formData, contatos: contatos as ContatoEmpresa[], enderecos: enderecos as EnderecoEmpresa[] });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <Texto variant="subtitulo">{initialData ? 'Editar Empresa' : 'Cadastro de Empresa'}</Texto>
                  <Texto variant="detalhe">Configure os dados principais, contatos e endereços</Texto>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-white/5 bg-white/[0.02] overflow-x-auto no-scrollbar">
              {[
                { id: 'dados', label: 'Dados Básicos', icon: Building2 },
                { id: 'contatos', label: 'Contatos', icon: Users },
                { id: 'enderecos', label: 'Endereços', icon: MapPin },
                { id: 'obrigacoes', label: 'Obrigações', icon: FileText },
                { id: 'extras', label: 'Extras & Tags', icon: Plus }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as Tab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                    activeTab === t.id ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                  {activeTab === t.id && (
                    <motion.div
                      layoutId="activeTabEmpresa"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
              {activeTab === 'dados' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EntradaTexto
                      label="Razão Social"
                      placeholder="Ex: Contabilidade Pro LTDA"
                      value={formData.razaoSocial}
                      onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })}
                      required
                    />
                    <EntradaTexto
                      label="Nome Fantasia"
                      placeholder="Ex: ContábilPro"
                      value={formData.nomeFantasia}
                      onChange={e => setFormData({ ...formData, nomeFantasia: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EntradaTexto
                      label="CNPJ / CPF / CAEPF"
                      placeholder="00.000.000/0001-00"
                      value={formData.identificacao}
                      onChange={e => setFormData({ ...formData, identificacao: e.target.value })}
                      required
                    />
                    <Seletor
                      label="Regime Tributário"
                      opcoes={[
                        { valor: 'SIMPLES', rotulo: 'Simples Nacional' },
                        { valor: 'MEI', rotulo: 'MEI' },
                        { valor: 'PRESUMIDO', rotulo: 'Lucro Presumido' },
                        { valor: 'REAL', rotulo: 'Lucro Real' }
                      ]}
                      value={formData.regimeTributario}
                      onChange={e => setFormData({ ...formData, regimeTributario: e.target.value as RegimeTributario })}
                    />
                    <EntradaTexto
                      label="ID Interno"
                      placeholder="Ex: COD-123"
                      value={formData.identificadorInterno}
                      onChange={e => setFormData({ ...formData, identificadorInterno: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex-1">
                      <Texto variant="corpo" className="font-bold">Status da Empresa</Texto>
                      <Texto variant="detalhe">Define se a empresa está ativa no sistema</Texto>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, ativa: !formData.ativa })}
                      className={`w-14 h-7 rounded-full transition-all relative ${formData.ativa ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${formData.ativa ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'contatos' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Texto variant="corpo" className="font-bold">Contatos na Empresa</Texto>
                    <Botao variant="outline" size="sm" onClick={handleAddContato} className="flex items-center gap-2">
                      <Plus size={16} /> Adicionar Contato
                    </Botao>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {contatos.map((c, idx) => (
                      <Card key={c.id} variant="flat" className="relative group border-white/5 hover:border-white/10 transition-all">
                        <button 
                          onClick={() => handleRemoveContato(c.id!)}
                          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pr-10">
                          <EntradaTexto 
                            label="Nome" 
                            value={c.nome} 
                            onChange={e => {
                              const newC = [...contatos];
                              newC[idx].nome = e.target.value;
                              setContatos(newC);
                            }}
                          />
                          <EntradaTexto 
                            label="Cargo" 
                            value={c.cargo} 
                            onChange={e => {
                              const newC = [...contatos];
                              newC[idx].cargo = e.target.value;
                              setContatos(newC);
                            }}
                          />
                          <EntradaTexto 
                            label="Departamento" 
                            value={c.departamento} 
                            onChange={e => {
                              const newC = [...contatos];
                              newC[idx].departamento = e.target.value;
                              setContatos(newC);
                            }}
                          />
                          <EntradaTexto 
                            label="WhatsApp" 
                            value={c.celular} 
                            onChange={e => {
                              const newC = [...contatos];
                              newC[idx].celular = e.target.value;
                              setContatos(newC);
                            }}
                          />
                          <EntradaTexto 
                            label="E-mail" 
                            value={c.email} 
                            onChange={e => {
                              const newC = [...contatos];
                              newC[idx].email = e.target.value;
                              setContatos(newC);
                            }}
                          />
                        </div>
                      </Card>
                    ))}
                    {contatos.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                        <Texto variant="detalhe" className="opacity-50">Nenhum contato adicionado.</Texto>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'enderecos' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                    <Texto variant="corpo" className="font-bold">Endereços Registrados</Texto>
                    <Botao variant="outline" size="sm" onClick={handleAddEndereco} className="flex items-center gap-2">
                      <Plus size={16} /> Adicionar Endereço
                    </Botao>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {enderecos.map((e, idx) => (
                      <Card key={e.id} variant="flat" className="relative group border-white/5 hover:border-white/10 transition-all p-6">
                         <button 
                          onClick={() => handleRemoveEndereco(e.id!)}
                          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <EntradaTexto label="Logradouro" value={e.logradouro} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].logradouro = val.target.value;
                              setEnderecos(newE);
                            }} />
                          </div>
                          <EntradaTexto label="Número" value={e.numero} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].numero = val.target.value;
                              setEnderecos(newE);
                            }} />
                           <EntradaTexto label="CEP" value={e.cep} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].cep = val.target.value;
                              setEnderecos(newE);
                            }} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                           <EntradaTexto label="Bairro" value={e.bairro} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].bairro = val.target.value;
                              setEnderecos(newE);
                            }} />
                            <EntradaTexto label="Cidade" value={e.cidade} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].cidade = val.target.value;
                              setEnderecos(newE);
                            }} />
                             <EntradaTexto label="UF" value={e.uf} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].uf = val.target.value;
                              setEnderecos(newE);
                            }} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <EntradaTexto label="Inscrição Estadual" value={e.inscricaoEstadual} onChange={val => {
                              const newE = [...enderecos];
                              newE[idx].inscricaoEstadual = val.target.value;
                              setEnderecos(newE);
                            }} />
                            <div className="flex items-center gap-4 mt-6">
                              <input 
                                type="checkbox" 
                                checked={e.isentoIcms} 
                                onChange={val => {
                                  const newE = [...enderecos];
                                  newE[idx].isentoIcms = val.target.checked;
                                  setEnderecos(newE);
                                }}
                                className="w-5 h-5 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500" 
                              />
                              <Texto variant="corpo">Empresa Isenta de IE</Texto>
                            </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'obrigacoes' && (
                <div className="space-y-6">
                  <Texto variant="corpo" className="font-bold">Configuração de Obrigações Recursais</Texto>
                  <Texto variant="detalhe">Selecione quais guias e declarações esta empresa deve entregar mensalmente.</Texto>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'DAS', label: 'PGDAS Mensal (Simples)', icon: FileText },
                      { id: 'FGTS', label: 'Guia de FGTS', icon: FileText },
                      { id: 'PRO_LABORE', label: 'Pró-Labore', icon: FileText },
                      { id: 'DIRF', label: 'DIRF Anual', icon: FileText },
                      { id: 'DEFIS', label: 'DEFIS (Simples)', icon: FileText },
                      { id: '13_SALARIO', label: '13º Salário', icon: FileText }
                    ].map(obr => (
                      <label key={obr.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500" defaultChecked={formData.regimeTributario === 'SIMPLES' && (obr.id === 'DAS' || obr.id === 'DEFIS')} />
                        <div className="flex-1">
                          <Texto variant="corpo" className="font-medium group-hover:text-white transition-colors">{obr.label}</Texto>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'extras' && (
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="space-y-4">
                    <Texto variant="corpo" className="font-bold">Tags de Organização</Texto>
                    <div className="flex flex-wrap gap-2">
                       {['Prioritário', 'Simples Nacional', 'Transferência', 'Revisar IE'].map(tag => (
                         <button key={tag} className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all">
                           {tag}
                         </button>
                       ))}
                       <button className="px-3 py-1.5 rounded-full bg-white/5 border border-dashed border-white/20 text-slate-400 text-xs font-bold hover:border-white/40 transition-all flex items-center gap-1">
                         <Plus size={12} /> Nova Tag
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <Texto variant="corpo" className="font-bold">Comentários e Anotações Gerais</Texto>
                     <textarea 
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        placeholder="Adicione observações importantes sobre o cliente aqui..."
                     ></textarea>
                  </div>

                  <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-4">
                     <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                        <Globe size={24} />
                     </div>
                     <div>
                        <Texto variant="corpo" className="font-bold">Website e Links</Texto>
                        <Texto variant="detalhe">Acesso rápido aos portais do cliente</Texto>
                     </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end items-center gap-4">
              <Botao variant="outline" onClick={onClose}>Cancelar</Botao>
              <Botao className="px-8 flex items-center gap-2" onClick={handleSave}>
                <Save size={18} />
                Salvar Empresa
              </Botao>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
