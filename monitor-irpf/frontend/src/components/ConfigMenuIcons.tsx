import type { SVGProps } from "react";

const s = { width: 22, height: 22, viewBox: "0 0 24 24" as const };

/** Ícones do menu de mosaicos em Configurações (traço, cor via currentColor). */

export function IconPastaIrpf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" {...props}>
      <path d="M4 6.5a1.5 1.5 0 0 1 1.5-1.5h4l1.5 2H19a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 17V6.5z" />
    </svg>
  );
}

export function IconIntegracoes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" {...props}>
      <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2" />
      <path d="M8 12h8" />
    </svg>
  );
}

export function IconContador(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" {...props}>
      <rect x="4" y="7" width="16" height="11" rx="1.5" />
      <path d="M8 7V5.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V7" />
      <path d="M9.5 12h5M9.5 14.5h3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSerpro(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" {...props}>
      <path d="M5 20V6l7-3 7 3v14" />
      <path d="M9 20V11h6v9" />
      <path d="M9 11V8h6v3" />
    </svg>
  );
}

export function IconWhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L4 21l1.7-4.8A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeLinecap="round" />
    </svg>
  );
}
