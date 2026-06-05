import type { ComponentType, SVGProps } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  IconClientes,
  IconConfig,
  IconDarf,
  IconDeclaracoes,
  IconDashboard,
  IconDocumentos,
  IconDiagnostico,
  IconInsights,
  IconMalha,
  IconMensagens,
  IconRestituicoes,
  IconPrecificacao,
  IconProcuracoes,
  IconSerpro,
  IconUsuario,
} from "./NavIcons";

type NavItem = {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", Icon: IconDashboard },
  { to: "/declaracoes", label: "Declarações (CPF)", Icon: IconDeclaracoes },
  { to: "/usuarios", label: "Usuários", Icon: IconUsuario },
  { to: "/clientes", label: "Clientes", Icon: IconClientes },
  { to: "/documentos", label: "Documentos", Icon: IconDocumentos },
  { to: "/procuracoes", label: "Procurações", Icon: IconProcuracoes },
  { to: "/precificacao", label: "Precificação e Cobrança", Icon: IconPrecificacao },
  { to: "/darf", label: "DARF", Icon: IconDarf },
  { to: "/malha", label: "Malha", Icon: IconMalha },
  { to: "/restituicoes", label: "Restituições", Icon: IconRestituicoes },
  { to: "/diagnostico-fiscal", label: "Diagnóstico fiscal", Icon: IconDiagnostico },
  { to: "/mensagens-ecac", label: "Mensagens e-CAC", Icon: IconMensagens },
  { to: "/insights", label: "Insights", Icon: IconInsights },
  { to: "/consulta-serpro", label: "Consulta SERPRO", Icon: IconSerpro },
  { to: "/configuracoes", label: "Configurações", Icon: IconConfig },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Carteira IRPF</h1>
          <p>Declarações, arquivos locais e acompanhamento fiscal.</p>
        </div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
            >
              <span className="nav-icon" aria-hidden>
                <item.Icon />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-column">
        <Outlet />
      </div>
    </div>
  );
}
