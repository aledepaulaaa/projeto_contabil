Estrutura do número CAEPF:1º ao 9º dígito: Primeiros nove números do CPF.10º ao 12º dígito: Número sequencial.13º ao 14º dígito: Dígitos verificadores

Exemplo validação Javascript:
function validarCAEPF(caepf) {
  // Remove caracteres especiais
  caepf = caepf.replace(/[^\d]+/g, '');

  // CAEPF precisa ter 14 dígitos
  if (caepf.length !== 14) return false;

  // Elimina sequências inválidas conhecidas (opcional, mas recomendado)
  if (/^(\d)\1{13}$/.test(caepf)) return false;

  // Validação dos Dígitos Verificadores
  let t = caepf.substring(0, 12);
  let d = caepf.substring(12);
  let s = 0;
  let pos = 9;

  // Cálculo do primeiro dígito
  for (let i = 11; i >= 0; i--) {
    s += t.charAt(11 - i) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  let r = s % 11;
  let dv1 = (r < 2) ? 0 : 11 - r;

  if (dv1 != d.charAt(0)) return false;

  // Cálculo do segundo dígito
  t = caepf.substring(0, 13);
  s = 0;
  pos = 9;
  for (let i = 12; i >= 0; i--) {
    s += t.charAt(12 - i) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  r = s % 11;
  let dv2 = (r < 2) ? 0 : 11 - r;

  if (dv2 != d.charAt(1)) return false;

  return true;
}

// Exemplo de uso:
// console.log(validarCAEPF("293.118.610/001-00"));
Algoritmo: É utilizado o módulo 11, com pesos que decrescem de 9 a 2, voltando a 9 após o 2.Limpeza: Use .replace(/[^\d]+/g, '') para garantir que apenas números sejam processados.Estrutura: O CAEPF é considerado válido se os 14 dígitos formarem uma sequência matemática corret