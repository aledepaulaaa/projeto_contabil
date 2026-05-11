

export type RegimeTributario = 'MEI' | 'SIMPLES' | 'PRESUMIDO' | 'REAL';

export interface ContatoEmpresa {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  celular: string;
  email: string;
}

export interface EnderecoEmpresa {
  id: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  isentoIcms: boolean;
}

export interface Empresa {
  id: string;
  identificadorInterno: string;
  razaoSocial: string;
  nomeFantasia: string;
  identificacao: string; // CNPJ/CPF/CAEPF
  regimeTributario: RegimeTributario;
  ativa: boolean;
  criadoEm: string;
  contatos: ContatoEmpresa[];
  enderecos: EnderecoEmpresa[];
  tags: string[];
}

export const regimeLabel = (regime: RegimeTributario) => {
  switch (regime) {
    case 'MEI': return 'MEI - Microempreendedor';
    case 'SIMPLES': return 'Simples Nacional';
    case 'PRESUMIDO': return 'Lucro Presumido';
    case 'REAL': return 'Lucro Real';
    default: return regime;
  }
};

export const getRegimeColor = (regime: RegimeTributario) => {
  switch (regime) {
    case 'MEI': return 'text-emerald-600 bg-emerald-500/10';
    case 'SIMPLES': return 'text-blue-600 bg-blue-500/10';
    case 'PRESUMIDO': return 'text-amber-600 bg-amber-500/10';
    case 'REAL': return 'text-rose-600 bg-rose-500/10';
    default: return 'text-slate-600 bg-slate-500/10';
  }
};
