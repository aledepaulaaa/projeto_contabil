import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ShieldCheck, Trash2, Plus } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { Card } from '../../atoms/Card/Card';
import { EntradaTexto } from '../../atoms/EntradaTexto/EntradaTexto';
import { Seletor } from '../../atoms/Seletor/Seletor';
import { TabelaGenerica, type ColunaTabela } from '../TabelaGenerica/TabelaGenerica';
import { useGestaoUsuarios, type Usuario } from '../../../hooks/useGestaoUsuarios';
import { useDepartamentos, type Departamento } from '../../../hooks/useDepartamentos';
import { useAuthStore } from '../../../store/authStore';

interface GestaoUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'equipe' | 'convidar' | 'departamentos';

export const GestaoUsuariosModal: React.FC<GestaoUsuariosModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('equipe');
  const { usuarios, loading: loadingUsers, convidarUsuario, removerUsuario } = useGestaoUsuarios();
  const { departamentos, loading: loadingDepts, criarDepartamento, excluirDepartamento } = useDepartamentos();
  const { papel: papelUsuarioLogado } = useAuthStore();

  // Estados Form Convite
  const [formConvite, setFormConvite] = useState({
    nome: '',
    email: '',
    papel: 'CONVIDADO',
    departamentoId: '',
    permissoes: [] as string[]
  });

  // Estados Form Departamento
  const [novoDepto, setNovoDepto] = useState({ nome: '', descricao: '' });

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await convidarUsuario(formConvite);
    if (success) {
      setActiveTab('equipe');
      setFormConvite({ nome: '', email: '', papel: 'CONVIDADO', departamentoId: '', permissoes: [] });
    }
  };

  const handleCriarDepto = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await criarDepartamento(novoDepto.nome, novoDepto.descricao);
    if (success) setNovoDepto({ nome: '', descricao: '' });
  };

  // Definição das Colunas - Equipe
  const colunasEquipe: ColunaTabela<Usuario>[] = [
    {
      chave: 'usuario',
      titulo: 'Membro',
      largura: 'col-span-3',
      renderizar: (u) => (
        <div className="flex flex-col">
          <Texto variant="corpo" className="font-medium text-xs">{u.nome}</Texto>
          <Texto variant="detalhe" className="text-slate-500 text-[10px]">{u.email}</Texto>
        </div>
      )
    },
    {
      chave: 'papel',
      titulo: 'Papel',
      largura: 'col-span-2',
      renderizar: (u) => (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${u.papel === 'ADMIN' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
            u.papel === 'GESTOR' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
              'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}>
          {u.papel}
        </span>
      )
    },
    {
      chave: 'depto',
      titulo: 'Departamento',
      largura: 'col-span-2',
      renderizar: (u) => (
        <Texto variant="corpo" className="text-[11px]">
          {departamentos?.find(d => d.id === u.departamentoId)?.nome || '—'}
        </Texto>
      )
    },
    {
      chave: 'permissoes',
      titulo: 'Permissões',
      largura: 'col-span-4',
      renderizar: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.permissoes?.length > 0 ? (
            u.permissoes.map(p => (
              <span key={p} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[8px] rounded border border-white/5 whitespace-nowrap" title={p}>
                {p.replace(/_/g, ' ')}
              </span>
            ))
          ) : (
            <Texto variant="detalhe" className="italic opacity-50">Nenhuma</Texto>
          )}
        </div>
      )
    },
    {
      chave: 'acoes',

      titulo: '',
      largura: 'col-span-1',
      renderizar: (u) => {
        // Lógica RBAC: Gestor não exclui Admin. Ninguém se exclui (teoricamente, mas garantimos a hierarquia no mínimo)
        const podeExcluir = papelUsuarioLogado === 'ADMIN' || (papelUsuarioLogado === 'GESTOR' && u.papel !== 'ADMIN' && u.papel !== 'GESTOR');
        
        if (!podeExcluir) return <div className="p-2 text-slate-700"><ShieldCheck size={16} /></div>;

        return (
          <button
            onClick={() => {
              if (window.confirm(`Deseja realmente remover ${u.nome} da equipe?`)) {
                removerUsuario(u.id);
              }
            }}
            className="p-2 text-slate-500 hover:text-red-500 transition-colors"
            title="Remover Usuário"
          >
            <Trash2 size={16} />
          </button>
        );
      }
    }
  ];

  // Definição das Colunas - Departamentos
  const colunasDepto: ColunaTabela<Departamento>[] = [
    {
      chave: 'nome',
      titulo: 'Nome do Setor',
      largura: 'col-span-5',
      renderizar: (d) => <Texto variant="corpo" className="font-medium">{d.nome}</Texto>
    },
    {
      chave: 'desc',
      titulo: 'Descrição',
      largura: 'col-span-5',
      renderizar: (d) => <Texto variant="detalhe">{d.descricao || 'Sem descrição'}</Texto>
    },
    {
      chave: 'acoes',
      titulo: '',
      largura: 'col-span-2',
      renderizar: (d) => (
        <button
          onClick={() => excluirDepartamento(d.id)}
          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  const permissoesDisponiveis = [
    { id: 'TRANSFERIR_ATENDIMENTO', label: 'Transferir Atendimentos' },
    { id: 'VER_MENSAGENS_WHATSAPP', label: 'Ver Histórico WhatsApp' },
    { id: 'INICIAR_ATENDIMENTO', label: 'Iniciar Novos Chats' },
    { id: 'ALOCAR_USUARIOS', label: 'Gerenciar Alocações' },
    { id: 'MARCAR_FLAGS_MENSAGEM', label: 'Marcar Flags em Chats' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <Texto variant="subtitulo">Gestão da Equipe</Texto>
                  <Texto variant="detalhe">Controle de acesso, departamentos e convites</Texto>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex px-6 border-b border-white/5 bg-white/[0.02]">
              {(['equipe', 'convidar', 'departamentos'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === t ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {activeTab === t && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
              {activeTab === 'equipe' && (
                <div className="space-y-4">
                  <TabelaGenerica
                    colunas={colunasEquipe}
                    dados={usuarios}
                    chaveUnica={(u) => u.id}
                    vazio={{
                      icone: <Users size={32} className="text-blue-500" />,
                      titulo: "Nenhum membro encontrado",
                      subtitulo: "Comece convidando alguém para sua equipe."
                    }}
                  />
                </div>
              )}

              {activeTab === 'convidar' && (
                <form onSubmit={handleConvidar} className="max-w-2xl mx-auto space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <EntradaTexto
                      label="Nome Completo"
                      placeholder="Ex: João Silva"
                      value={formConvite.nome}
                      onChange={e => setFormConvite({ ...formConvite, nome: e.target.value })}
                      required
                    />
                    <EntradaTexto
                      label="E-mail Profissional"
                      type="email"
                      placeholder="joao@empresa.com"
                      value={formConvite.email}
                      onChange={e => setFormConvite({ ...formConvite, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Seletor
                      label="Papel (Role)"
                      opcoes={[
                        { valor: 'ADMIN', rotulo: 'Administrador (Total)' },
                        { valor: 'GESTOR', rotulo: 'Gestor (Equipe)' },
                        { valor: 'CONVIDADO', rotulo: 'Convidado (Operador)' }
                      ]}
                      value={formConvite.papel}
                      onChange={e => setFormConvite({ ...formConvite, papel: e.target.value })}
                    />
                    <Seletor
                      label="Departamento"
                      opcoes={departamentos.map(d => ({ valor: d.id, rotulo: d.nome }))}
                      value={formConvite.departamentoId}
                      onChange={e => setFormConvite({ ...formConvite, departamentoId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Texto variant="label" className="text-slate-400">Permissões Específicas</Texto>
                    <div className="grid grid-cols-2 gap-3">
                      {permissoesDisponiveis.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-blue-600 focus:ring-blue-500"
                            checked={formConvite.permissoes.includes(p.id)}
                            onChange={e => {
                              const novas = e.target.checked
                                ? [...formConvite.permissoes, p.id]
                                : formConvite.permissoes.filter(x => x !== p.id);
                              setFormConvite({ ...formConvite, permissoes: novas });
                            }}
                          />
                          <Texto variant="detalhe" className="group-hover:text-white transition-colors">{p.label}</Texto>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Botao type="submit" className="w-full mt-8 h-12" loading={loadingUsers}>
                    Disparar Convite por E-mail
                  </Botao>
                </form>
              )}

              {activeTab === 'departamentos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <Card variant="flat" className="space-y-4">
                      <Texto variant="corpo" className="font-bold">Novo Departamento</Texto>
                      <form onSubmit={handleCriarDepto} className="space-y-4">
                        <EntradaTexto
                          label="Nome"
                          placeholder="Ex: Comercial"
                          value={novoDepto.nome}
                          onChange={e => setNovoDepto({ ...novoDepto, nome: e.target.value })}
                          required
                        />
                        <EntradaTexto
                          label="Descrição"
                          placeholder="Objetivo do setor..."
                          value={novoDepto.descricao}
                          onChange={e => setNovoDepto({ ...novoDepto, descricao: e.target.value })}
                        />
                        <Botao type="submit" variant="outline" className="w-full h-10" loading={loadingDepts}>
                          <Plus size={18} className="mr-2" /> Criar Setor
                        </Botao>
                      </form>
                    </Card>
                  </div>
                  <div className="lg:col-span-2">
                    <TabelaGenerica colunas={colunasDepto} dados={departamentos} chaveUnica={d => d.id} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
