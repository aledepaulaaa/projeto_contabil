export interface MensagemEcac {
  id: string;
  assunto: string;
  data: string;
  lida: boolean;
  corpo_resumo: string | null;
}