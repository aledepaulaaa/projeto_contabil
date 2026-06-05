export interface RfbInfosimplesConfig {
  enabled: boolean;
  /** Token para acesso à API (enviado no parâmetro `token` da consulta). */
  token: string;
  /** Token secreto (40 caracteres no painel). Pode ser usado como material AES (primeiros 32) para cifrar pkcs12; não substitui o token no POST. */
  tokenSecreto?: string;
  timeoutSec?: number;
  perfilProcuradorCnpj?: string;
  useContadorCert?: boolean;
  pkcs12Cert?: string;
  pkcs12Pass?: string;
  loginCpf?: string;
  loginSenha?: string;
  /** CHAVE DE CRIPTOGRAFIA no painel (típico 40 caracteres; AES usa os primeiros 32). Cifra pkcs12_* e login_senha no pedido. */
  criptografiaChave?: string;
  criptografiaMaterial?: "chave_conta" | "token" | "token_secreto";
  criptografiaBase64Ruby?: boolean;
  /** null = automático (cifra só se chave ≥32); true/false = forçar. */
  cifrarParametrosPkcs12?: boolean | null;
  /** Se true e a cifra estiver ativa: só pkcs12_pass e login_senha são cifrados; pkcs12_cert permanece em Base64 claro. */
  cifrarApenasPkcs12Pass?: boolean;
}