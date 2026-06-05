/** Referências por faixa para precificação «personalizado» (valores de apoio; o cobrado segue o cadastro). */
export interface PersonalizadoEscalonamento {
  fontes_pagamento_1_a_3: string;
  fontes_pagamento_4_a_10: string;
  fontes_pagamento_11_ou_mais: string;
  valor_por_dependente: string;
  investimento_em_acoes: string;
  bens_1_a_5: string;
  bens_6_a_10: string;
  bens_11_ou_mais: string;
}