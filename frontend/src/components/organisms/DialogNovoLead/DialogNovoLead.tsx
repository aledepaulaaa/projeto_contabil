import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Building2, RefreshCw, ShieldCheck, Send } from 'lucide-react';
import { Texto } from '../../atoms/Texto/Texto';
import { Card } from '../../atoms/Card/Card';
import { Botao } from '../../atoms/Botao/Botao';
import { LeadService } from '../../../services/LeadService';

type TipoServicoCRM = 'ABERTURA' | 'TRANSFERENCIA' | 'REGULARIZACAO' | null;

interface DadosLead {
  // Comuns
  nomeContato: string;
  telefone: string;
  email: string;
  origem: string;
  responsavel: string;
  nomeEmpresa: string;
  cnpj: string;
  tipoServico: TipoServicoCRM;
  // Abertura
  cnae: string;
  previsaoFaturamento: string;
  qtdSocios: string;
  localizacao: string;
  conselhoClasse: string;
  // Troca
  motivoTroca: string;
  regimeAtual: string;
  volumeNfe: string;
  qtdFuncionarios: string;
  dataEncerramento: string;
  // Regularização
  ultimaAlteracao: string;
  certificadoDigital: string;
}

const dadosIniciais: DadosLead = {
  nomeContato: '', telefone: '', email: '', origem: '', responsavel: '', nomeEmpresa: '', cnpj: '',
  tipoServico: null,
  cnae: '', previsaoFaturamento: '', qtdSocios: '', localizacao: '', conselhoClasse: '',
  motivoTroca: '', regimeAtual: '', volumeNfe: '', qtdFuncionarios: '', dataEncerramento: '',
  ultimaAlteracao: '', certificadoDigital: '',
};

interface DialogNovoLeadProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

const tiposServico = [
  { valor: 'ABERTURA' as const, label: 'Abertura de Empresa', desc: 'Nova empresa a ser constituída', icon: Building2, cor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
  { valor: 'TRANSFERENCIA' as const, label: 'Troca de Contador', desc: 'Migração de outra contabilidade', icon: RefreshCw, cor: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' },
  { valor: 'REGULARIZACAO' as const, label: 'Regularização', desc: 'Empresa existente com pendências', icon: ShieldCheck, cor: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' },
];

const origens = ['CAMPANHA', 'ORGANICO', 'INDICACAO'];

/**
 * Dialog Multi-step estilo RD Station para cadastro de Lead.
 * Passo 1: Dados comuns + Tipo de Serviço
 * Passo 2: Campos condicionais baseados no tipo (Abertura/Troca/Regularização)
 * Passo 3: Revisão e confirmação
 */
export const DialogNovoLead: React.FC<DialogNovoLeadProps> = ({ aberto, onFechar, onSucesso }) => {
  const [passo, setPasso] = useState(0); // 0: Seleção de Serviço, 1: Dados, 2: Detalhes, 3: Revisão
  const [dados, setDados] = useState<DadosLead>(dadosIniciais);
  const [enviando, setEnviando] = useState(false);

  const totalPassos = 3;

  const mudarCampo = (campo: keyof DadosLead, valor: string) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
  };

  const resetar = () => {
    setDados(dadosIniciais);
    setPasso(0);
    setEnviando(false);
  };

  const fechar = () => {
    resetar();
    onFechar();
  };

  const validarPasso = () => {
    if (passo === 0) return !!dados.tipoServico;
    if (passo === 1) {
      const basicos = !!dados.nomeContato && !!dados.email && !!dados.nomeEmpresa;
      if (dados.tipoServico === 'ABERTURA') return basicos; // CPF opcional ou validado depois
      return basicos && !!dados.cnpj;
    }
    return true;
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      await LeadService.criarConta({
        nome: dados.nomeContato,
        email: dados.email,
        cnpj: dados.cnpj,
        nomeEmpresa: dados.nomeEmpresa,
        origem: dados.origem || undefined,
        tipoServico: dados.tipoServico || undefined,
      });
      onSucesso();
      fechar();
    } catch {
      // Erro tratado pelo interceptor global
    } finally {
      setEnviando(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-text-main placeholder:text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block";

  // Máscara CPF: 000.000.000-00 (max 11 dígitos)
  const mascaraCpf = (v: string) => {
    v = v.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
  };

  // Máscara CNPJ: 00.000.000/0001-00 (max 14 dígitos)
  const mascaraCnpj = (v: string) => {
    v = v.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    return v;
  };

  const handleDocumentoChange = (valor: string) => {
    const digitos = valor.replace(/\D/g, '');
    const formatado = dados.tipoServico === 'ABERTURA'
      ? mascaraCpf(digitos)
      : mascaraCnpj(digitos);
    mudarCampo('cnpj', formatado);
  };

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={fechar} className="fixed inset-0 bg-black/50 z-[100]" />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto pointer-events-auto bg-primary-bg border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 sticky top-0 bg-primary-bg z-10">
                <div>
                  <Texto variant="subtitulo">Novo Lead Manual</Texto>
                  <Texto variant="detalhe" className="mt-0.5">
                    {passo === 0 ? 'Selecione o serviço' : `Passo ${passo} de ${totalPassos}`}
                  </Texto>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress dots */}
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map(p => (
                      <div key={p} className={`w-2 h-2 rounded-full transition-all ${p <= passo ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                  <button onClick={fechar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-text-secondary">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* PASSO 0: Tipo de Serviço */}
                {passo === 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <label className={labelClass}>Qual o serviço principal? *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                      {tiposServico.map(tipo => (
                        <button
                          key={tipo.valor}
                          onClick={() => {
                            mudarCampo('tipoServico', tipo.valor);
                            setPasso(1);
                          }}
                          className={`p-5 rounded-2xl border-2 transition-all text-left group ${dados.tipoServico === tipo.valor ? tipo.cor + ' shadow-lg scale-[1.02]' : 'border-slate-100 dark:border-white/5 hover:border-slate-200'}`}
                        >
                          <tipo.icon size={24} className="mb-3 transition-transform group-hover:scale-110" />
                          <Texto variant="corpo" className="font-bold text-sm">{tipo.label}</Texto>
                          <Texto variant="detalhe" className="text-[11px] mt-1 line-clamp-2">{tipo.desc}</Texto>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* PASSO 1: Dados Comuns */}
                {passo === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Nome da Empresa *</label>
                        <input className={inputClass} placeholder="Ex: Contabilidade Alpha Ltda" value={dados.nomeEmpresa} onChange={e => mudarCampo('nomeEmpresa', e.target.value)} />
                      </div>

                      {dados.tipoServico === 'ABERTURA' ? (
                        <div>
                          <label className={labelClass}>CPF do Sócio Principal</label>
                          <input className={inputClass} placeholder="000.000.000-00" value={dados.cnpj} onChange={e => handleDocumentoChange(e.target.value)} maxLength={14} />
                        </div>
                      ) : (
                        <div>
                          <label className={labelClass}>CNPJ da Empresa *</label>
                          <input className={inputClass} placeholder="00.000.000/0001-00" value={dados.cnpj} onChange={e => handleDocumentoChange(e.target.value)} maxLength={18} />
                        </div>
                      )}

                      <div>
                        <label className={labelClass}>Nome do Contato *</label>
                        <input className={inputClass} placeholder="João Silva" value={dados.nomeContato} onChange={e => mudarCampo('nomeContato', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>E-mail *</label>
                        <input className={inputClass} placeholder="contato@empresa.com" type="email" value={dados.email} onChange={e => mudarCampo('email', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Telefone</label>
                        <input className={inputClass} placeholder="(11) 99999-8888" value={dados.telefone} onChange={e => mudarCampo('telefone', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelClass}>Origem</label>
                        <select className={inputClass} value={dados.origem} onChange={e => mudarCampo('origem', e.target.value)}>
                          <option value="">Selecionar...</option>
                          {origens.map(o => <option key={o} value={o}>{o === 'CAMPANHA' ? 'Campanha' : o === 'ORGANICO' ? 'Orgânico' : 'Indicação'}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Responsável</label>
                        <input className={inputClass} placeholder="Consultor Comercial" value={dados.responsavel} onChange={e => mudarCampo('responsavel', e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PASSO 2: Detalhes Técnicos */}
                {passo === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    {dados.tipoServico === 'ABERTURA' && (
                      <>
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 mb-4">
                          <Building2 size={24} className="text-emerald-500" />
                          <Texto variant="corpo" className="font-bold text-emerald-700 dark:text-emerald-400">Dados do novo empreendimento</Texto>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className={labelClass}>CNAE Principal</label><input className={inputClass} placeholder="Ex: 6202-3/00" value={dados.cnae} onChange={e => mudarCampo('cnae', e.target.value)} /></div>
                          <div><label className={labelClass}>Faturamento Estimado</label><input className={inputClass} placeholder="R$ 50.000,00" value={dados.previsaoFaturamento} onChange={e => mudarCampo('previsaoFaturamento', e.target.value)} /></div>
                          <div><label className={labelClass}>Qtd de Sócios</label><input className={inputClass} type="number" placeholder="2" value={dados.qtdSocios} onChange={e => mudarCampo('qtdSocios', e.target.value)} /></div>
                          <div><label className={labelClass}>Cidade/UF</label><input className={inputClass} placeholder="São Paulo, SP" value={dados.localizacao} onChange={e => mudarCampo('localizacao', e.target.value)} /></div>
                          <div className="md:col-span-2"><label className={labelClass}>Conselho Profissional (se houver)</label><input className={inputClass} placeholder="Ex: CRM, OAB" value={dados.conselhoClasse} onChange={e => mudarCampo('conselhoClasse', e.target.value)} /></div>
                        </div>
                      </>
                    )}

                    {dados.tipoServico === 'TRANSFERENCIA' && (
                      <>
                        <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 mb-4">
                          <RefreshCw size={24} className="text-blue-500" />
                          <Texto variant="corpo" className="font-bold text-blue-700 dark:text-blue-400">Dados para migração</Texto>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2"><label className={labelClass}>Motivo da Saída</label><input className={inputClass} placeholder="Ex: Falta de atendimento" value={dados.motivoTroca} onChange={e => mudarCampo('motivoTroca', e.target.value)} /></div>
                          <div>
                            <label className={labelClass}>Regime Tributário</label>
                            <select className={inputClass} value={dados.regimeAtual} onChange={e => mudarCampo('regimeAtual', e.target.value)}>
                              <option value="">Selecionar...</option>
                              <option value="SIMPLES">Simples Nacional</option>
                              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                              <option value="MEI">MEI</option>
                            </select>
                          </div>
                          <div><label className={labelClass}>Volume NF-e / mês</label><input className={inputClass} type="number" placeholder="45" value={dados.volumeNfe} onChange={e => mudarCampo('volumeNfe', e.target.value)} /></div>
                          <div><label className={labelClass}>Funcionários</label><input className={inputClass} type="number" placeholder="5" value={dados.qtdFuncionarios} onChange={e => mudarCampo('qtdFuncionarios', e.target.value)} /></div>
                          <div><label className={labelClass}>Vigência (Mês/Ano)</label><input className={inputClass} type="month" value={dados.dataEncerramento} onChange={e => mudarCampo('dataEncerramento', e.target.value)} /></div>
                        </div>
                      </>
                    )}

                    {dados.tipoServico === 'REGULARIZACAO' && (
                      <>
                        <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 mb-4">
                          <ShieldCheck size={24} className="text-amber-500" />
                          <Texto variant="corpo" className="font-bold text-amber-700 dark:text-amber-400">Dados para regularização</Texto>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2"><label className={labelClass}>Principais Pendências</label><input className={inputClass} placeholder="Ex: DAS em atraso, Alvará vencido" value={dados.motivoTroca} onChange={e => mudarCampo('motivoTroca', e.target.value)} /></div>
                          <div><label className={labelClass}>Data da Última Alteração</label><input className={inputClass} type="date" value={dados.ultimaAlteracao} onChange={e => mudarCampo('ultimaAlteracao', e.target.value)} /></div>
                          <div>
                            <label className={labelClass}>Possui Certificado?</label>
                            <select className={inputClass} value={dados.certificadoDigital} onChange={e => mudarCampo('certificadoDigital', e.target.value)}>
                              <option value="">Selecionar...</option>
                              <option value="A1">Sim (A1)</option>
                              <option value="A3">Sim (A3)</option>
                              <option value="NAO">Não possui</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* PASSO 3: Revisão */}
                {passo === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="p-6 bg-slate-50/50 dark:bg-white/5 border-dashed space-y-4">
                      <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/10 pb-4">
                        <div>
                          <Texto variant="label">Empresa</Texto>
                          <Texto variant="subtitulo" className="text-lg">{dados.nomeEmpresa}</Texto>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${tiposServico.find(t => t.valor === dados.tipoServico)?.cor}`}>
                          {tiposServico.find(t => t.valor === dados.tipoServico)?.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Texto variant="label">Contato</Texto><Texto variant="corpo" className="text-sm">{dados.nomeContato}</Texto></div>
                        <div><Texto variant="label">CNPJ/CPF</Texto><Texto variant="corpo" className="text-sm font-mono">{dados.cnpj}</Texto></div>
                        <div><Texto variant="label">E-mail</Texto><Texto variant="corpo" className="text-sm">{dados.email}</Texto></div>
                        <div><Texto variant="label">Telefone</Texto><Texto variant="corpo" className="text-sm">{dados.telefone || 'Não informado'}</Texto></div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-4 p-6 border-t border-slate-200 dark:border-white/10 sticky bottom-0 bg-primary-bg">
                {passo > 0 && (
                  <button
                    onClick={() => setPasso(p => p - 1)}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-main transition-all"
                  >
                    <ArrowLeft size={16} /> Voltar
                  </button>
                )}

                {passo < totalPassos ? (
                  <Botao
                    onClick={() => setPasso(p => p + 1)}
                    disabled={!validarPasso()}
                    className="px-10 flex items-center gap-2 h-11"
                  >
                    Próximo <ArrowRight size={16} />
                  </Botao>
                ) : (
                  <Botao
                    onClick={enviar}
                    disabled={enviando}
                    className="px-10 flex items-center gap-2 h-11"
                  >
                    {enviando ? 'Cadastrando...' : 'Finalizar Cadastro'}
                    <Send size={16} />
                  </Botao>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
