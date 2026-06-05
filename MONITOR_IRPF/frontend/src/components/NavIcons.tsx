import type { SVGProps } from "react";

const base = { width: 24, height: 24, viewBox: "0 0 24 24" as const };

/** Ícones da barra lateral — cores alinhadas à referência (branco, roxo contatos, $ verde). */
export function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.2" />
      <rect x="13" y="3" width="8" height="8" rx="1.2" />
      <rect x="3" y="13" width="8" height="8" rx="1.2" />
      <rect x="13" y="13" width="8" height="8" rx="1.2" />
    </svg>
  );
}

export function IconDeclaracoes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 4.5 19.5 12 12 19.5 4.5 12z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsuario(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="#f3e5f5" stroke="#ffffff" strokeWidth="1.35" {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6.5 19.5c0-3.5 2.5-5.5 5.5-5.5s5.5 2 5.5 5.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function IconDocumentos(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
      <path d="M8 4h8l2 2h4v14H4V4h4z" />
      <path d="M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

export function IconClientes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" strokeWidth="1.35" {...props}>
      <g stroke="#ffffff">
        <circle cx="9" cy="8.5" r="2.6" fill="#ede7f6" />
        <path d="M4.5 19c0-2.8 2-4.5 4.5-4.5.8 0 1.5.15 2.1.4" strokeLinecap="round" fill="none" />
      </g>
      <g stroke="#ffffff">
        <circle cx="16.5" cy="7.5" r="2.2" fill="#e1bee7" />
        <path d="M12.5 19v-.2c0-2.2 1.6-3.8 4-4.3" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function IconProcuracoes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
      <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 7 4.5z" />
      <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconPrecificacao(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" {...props}>
      <path
        d="M12 4v16M9.2 8.2c0-1.6 1.8-2.2 3.4-2.2 2.2 0 3.4 1 3.4 2.6 0 2-2.6 2.4-4.2 2.8-2 .4-3.6 1-3.6 3.2 0 2.4 2 3.4 4.4 3.4 1.8 0 3.6-.6 4-2.6"
        stroke="#b9f6ca"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDarf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
      <path d="M9 3.5h6l1.5 2H19a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5h3.5L9 3.5z" />
      <path d="M8 10h8M8 13.5h6" strokeLinecap="round" />
      <circle cx="15.5" cy="16" r="1.8" fill="#ffcc80" stroke="#fff" strokeWidth="0.9" />
    </svg>
  );
}

export function IconMalha(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
      <path d="M12 5.5 20.5 18.5H3.5L12 5.5z" />
      <path d="M12 10v3.5M12 16h.02" strokeLinecap="round" />
    </svg>
  );
}

export function IconRestituicoes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" {...props}>
      <circle cx="12" cy="12" r="7.5" fill="#ffca28" stroke="#fff" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="5.2" fill="#ffb300" stroke="#f9a825" strokeWidth="0.9" />
      <ellipse cx="9.8" cy="9.6" rx="2.2" ry="1.3" fill="#fff8e1" opacity="0.75" />
      <path
        d="M12 8.2v7.6M13.8 10.2c0-1.2-1-1.8-2.3-1.8s-2.2.55-2.2 1.45c0 .85.75 1.35 2.2 1.45 1.5.1 2.3.6 2.3 1.5 0 .95-.9 1.55-2.4 1.55"
        stroke="#e65100"
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IconDiagnostico(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" {...props}>
      <circle cx="11" cy="11" r="7.5" fill="#4fc3f7" />
      <circle cx="11" cy="11" r="7.5" stroke="#e1f5fe" strokeWidth="1.35" fill="none" />
      <g stroke="#fff" strokeWidth="1.85" strokeLinecap="round" fill="none">
        <circle cx="11" cy="11" r="3.4" />
        <path d="m16.5 16.5 3.2 3.2" />
      </g>
    </svg>
  );
}

export function IconMensagens(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
      <path d="M4.5 6.5h15a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-11l-4 3v-3h-1a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1z" />
      <path d="M8 10h8" strokeLinecap="round" />
    </svg>
  );
}

export function IconInsights(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.5l1.8 5.5h5.8l-4.7 3.4 1.8 5.5L12 13.9 7.3 17l1.8-5.5L4.4 8l5.8-.1L12 2.5z" />
    </svg>
  );
}

/** Engrenagem 8 dentes (traço contínuo + furo central), estilo ícone de configurações. */
export function IconConfig(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...base}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="miter"
      strokeMiterlimit="2.5"
      {...props}
    >
      <path d="M10.259 7.796 10.897 5.037 13.103 5.037 13.741 7.796 16.144 6.296 17.704 7.856 16.204 10.259 18.963 10.897 18.963 13.103 16.204 13.741 17.704 16.144 16.144 17.704 13.741 16.204 13.103 18.963 10.897 18.963 10.259 16.204 7.856 17.704 6.296 16.144 7.796 13.741 5.037 13.103 5.037 10.897 7.796 10.259 6.296 7.856 7.856 6.296 10.259 7.796z" />
      <circle cx="12" cy="12" r="2.85" />
    </svg>
  );
}

/** Lápis — editar / ir às declarações. */
export function IconPencil(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...base}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7.5 20.5 2 22l1.5-5.5L16.5 3.5z" />
    </svg>
  );
}

/** X — excluir. */
export function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...base}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

/** Ícone SERPRO — escudo com símbolo de banco de dados */
export function IconSerpro(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3L4 6.5v5c0 4.5 3.4 8.7 8 9.8 4.6-1.1 8-5.3 8-9.8v-5L12 3z" fill="#4fc3f7" fillOpacity="0.25" />
      <ellipse cx="12" cy="10" rx="4" ry="1.5" />
      <path d="M8 10v1.5c0 .8 1.8 1.5 4 1.5s4-.7 4-1.5V10" />
      <path d="M8 11.5V13c0 .8 1.8 1.5 4 1.5s4-.7 4-1.5v-1.5" />
    </svg>
  );
}
