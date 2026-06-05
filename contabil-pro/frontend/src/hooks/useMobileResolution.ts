import { useState, useEffect } from 'react';

export function useMobileResolution(breakpoint: number = 320) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkResolution = () => {
      // Usualmente mobile primeiro pode ser visto se for menor ou igual a um limiar,
      // mas como o pedido pede foco especial em "ver se está no mobile base de 320px":
      setIsMobile(window.innerWidth <= breakpoint);
    };

    checkResolution();
    window.addEventListener('resize', checkResolution);
    return () => window.removeEventListener('resize', checkResolution);
  }, [breakpoint]);

  return isMobile;
}
