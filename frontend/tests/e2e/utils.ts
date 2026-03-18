export function gerarCNPJ() {
  const n = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  
  const calcularDigito = (numeros: number[], pesos: number[]) => {
    let soma = numeros.reduce((acc, current, idx) => acc + current * pesos[idx], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digito1 = calcularDigito(n, pesos1);
  const n2 = [...n, digito1];
  
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digito2 = calcularDigito(n2, pesos2);
  
  return [...n2, digito2].join('');
}
