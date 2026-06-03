import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  ShieldAlert, 
  DollarSign, 
  Calendar, 
  UserCheck, 
  Building2, 
  FileText,
  AlertCircle,
  TrendingUp,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { Botao } from '../../components/atoms/Botao/Botao';
import { Texto } from '../../components/atoms/Texto/Texto';
import { Card } from '../../components/atoms/Card/Card';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';
import { useConsultaRenda } from '../../hooks/useConsultaRenda';

export const Serpro: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const { dadosRenda, consultar, isLoading, error, reset } = useConsultaRenda();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    consultar(tokenInput.trim());
  };

  const formatarValor = (codigo: string, valor: string) => {
    if (!valor) return 'N/A';
    
    // Códigos de 1 a 6 são valores monetários
    const codigosMonetarios = ['1', '2', '3', '4', '5', '6'];
    if (codigosMonetarios.includes(codigo)) {
      const num = parseFloat(valor);
      if (isNaN(num)) return valor;
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }
    
    return valor;
  };

  // Auxiliares para extrair valores destacados para os cards de métricas
  const buscarValorPorCodigo = (codigo: string) => {
    if (!dadosRenda) return 'R$ 0,00';
    const item = dadosRenda.dados.find(d => d.codigo === codigo);
    return item ? formatarValor(codigo, item.valor) : 'R$ 0,00';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Texto variant="titulo" className="flex items-center gap-3">
          <Database className="text-blue-600 dark:text-blue-500" size={28} />
          Consulta e Renda (SERPRO)
        </Texto>
        <Texto variant="corpo" className="text-text-secondary mt-1">
          Acesso seguro a dados de renda da Declaração de IRPF via Compartilha Receita Federal
        </Texto>
      </div>

      {/* Formulário de Busca */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-5 max-w-3xl">
          <div className="flex flex-col gap-3">
            <label htmlFor="token-serpro" className="text-xs font-bold uppercase tracking-wide text-text-secondary">
              Token de Compartilhamento do Contribuinte
            </label>
            
            {/* Input Ampliado */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
              <input 
                id="token-serpro"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Cole aqui o token gerado no e-CAC (ex: 06aef429-a981-3ec5-a1f8-71d38d86481e)..."
                disabled={isLoading}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 text-base focus:outline-none focus:border-blue-500/50 text-text-main placeholder:text-text-secondary shadow-inner transition-all duration-200"
              />
            </div>

            {/* Checkout Verde de Sucesso do Token */}
            {tokenInput.trim().length === 36 && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Token no formato válido (36 caracteres) detectado. Pronto para consulta.</span>
              </div>
            )}

            {/* Botão de Consulta Alinhado Abaixo (Column) */}
            <div className="pt-2">
              <Botao 
                type="submit" 
                disabled={isLoading || !tokenInput.trim()}
                className="py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 w-full sm:w-auto self-start min-w-[200px] text-sm font-semibold transition-transform active:scale-[0.98]"
              >
                {isLoading ? 'Consultando...' : 'Consultar Renda'}
              </Botao>
            </div>

            <Texto variant="detalhe" className="text-slate-500 mt-2 flex items-start gap-1.5 leading-relaxed">
              <ShieldAlert size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção LGPD:</strong> A obtenção de dados fiscais requer o consentimento ativo do titular. O token deve ser gerado pelo cidadão na opção "Autorizar Compartilhamento de Dados" no Portal e-CAC.
              </span>
            </Texto>
          </div>
        </form>
      </Card>

      {/* Erro Box */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 flex items-start gap-3 transition-all animate-fadeIn">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <Texto variant="corpo" className="font-semibold text-red-700 dark:text-red-400">Falha ao buscar dados</Texto>
            <Texto variant="detalhe" className="text-red-600 dark:text-red-500 leading-normal">{error}</Texto>
          </div>
        </div>
      )}

      {/* Skeletons de Loading */}
      {isLoading && (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-28 flex flex-col justify-between py-5 px-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-40 mt-2" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 h-64 space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-3 w-full" />)}
              </div>
            </Card>
            <Card className="md:col-span-2 h-64 space-y-4">
              <Skeleton className="h-4 w-40" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4, 5].map(j => <Skeleton key={j} className="h-3 w-full" />)}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Resultado */}
      {dadosRenda && !isLoading && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Estatísticas / Principais Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4 py-5 px-5 border-l-4 border-l-blue-600 dark:border-l-blue-500">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                <TrendingUp size={22} />
              </div>
              <div>
                <Texto variant="label" className="text-[10px] tracking-wider uppercase">Patrimônio Total</Texto>
                <Texto variant="titulo" className="text-xl md:text-2xl mt-0.5">{buscarValorPorCodigo('3')}</Texto>
              </div>
            </Card>

            <Card className="flex items-center gap-4 py-5 px-5 border-l-4 border-l-emerald-600 dark:border-l-emerald-500">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                <DollarSign size={22} />
              </div>
              <div>
                <Texto variant="label" className="text-[10px] tracking-wider uppercase">Rendimentos Tributáveis</Texto>
                <Texto variant="titulo" className="text-xl md:text-2xl mt-0.5">{buscarValorPorCodigo('2')}</Texto>
              </div>
            </Card>

            <Card className="flex items-center gap-4 py-5 px-5 border-l-4 border-l-indigo-600 dark:border-l-indigo-500">
              <div className="p-3 rounded-lg bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                <Building2 size={22} />
              </div>
              <div>
                <Texto variant="label" className="text-[10px] tracking-wider uppercase">Rendimento de Fontes PJ</Texto>
                <Texto variant="titulo" className="text-xl md:text-2xl mt-0.5">{buscarValorPorCodigo('1')}</Texto>
              </div>
            </Card>
          </div>

          {/* Dados Gerais e Tabela de Rendimentos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Metadados da Consulta */}
            <Card className="space-y-4 lg:col-span-1">
              <Texto variant="titulo" className="text-base flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <UserCheck size={18} className="text-blue-500" />
                Dados da Autorização
              </Texto>
              <div className="space-y-3">
                <div>
                  <Texto variant="label" className="text-[10px]">Titular (CPF Criptografado)</Texto>
                  <Texto variant="corpo" className="font-semibold text-sm break-all font-mono mt-0.5">{dadosRenda.titular}</Texto>
                </div>
                <div>
                  <Texto variant="label" className="text-[10px]">Destinatário (CNPJ Contador)</Texto>
                  <Texto variant="corpo" className="font-semibold text-sm break-all font-mono mt-0.5">{dadosRenda.destinatario}</Texto>
                </div>
                <div>
                  <Texto variant="label" className="text-[10px]">Data/Hora do Registro</Texto>
                  <Texto variant="corpo" className="font-semibold text-sm mt-0.5">
                    {dadosRenda.dataHoraRegistro ? new Date(dadosRenda.dataHoraRegistro).toLocaleString('pt-BR') : 'N/A'}
                  </Texto>
                </div>
                <div>
                  <Texto variant="label" className="text-[10px]">Token Utilizado</Texto>
                  <Texto variant="detalhe" className="font-mono text-xs break-all bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200/50 dark:border-slate-800/50 mt-1">
                    {dadosRenda.token}
                  </Texto>
                </div>
                <div className="pt-2">
                  <Botao variant="outline" onClick={reset} className="w-full flex items-center justify-center gap-2 text-xs py-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <XCircle size={16} />
                    Limpar Resultados
                  </Botao>
                </div>
              </div>
            </Card>

            {/* Tabela de Detalhes */}
            <Card noPadding className="lg:col-span-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Texto variant="titulo" className="text-base flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" />
                  Declaração de Rendimentos Analítica
                </Texto>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 text-xs">
                      <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Cód</th>
                      <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Especificação da Renda</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Valor Declarado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                    {dadosRenda.dados.map((item) => (
                      <tr key={item.codigo} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-slate-400">{item.codigo}</td>
                        <td className="px-6 py-3 font-medium text-text-main">{item.texto}</td>
                        <td className="px-6 py-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {formatarValor(item.codigo, item.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Aviso Legal / Rodapé */}
          {dadosRenda.avisoLegal && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-400 text-xs leading-relaxed flex items-start gap-3">
              <Calendar size={16} className="shrink-0 mt-0.5 text-blue-500" />
              <span>
                <strong>Aviso Legal do Sistema:</strong> {dadosRenda.avisoLegal}
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
