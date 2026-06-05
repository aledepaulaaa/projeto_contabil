import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import asaasLogo from "../assets/brands/asaas.png";
import contaAzulLogo from "../assets/brands/conta-azul.png";
import { AsaasIntegracaoPanel } from "../components/AsaasIntegracaoPanel";
import { ContaAzulIntegracaoPanel } from "../components/ContaAzulIntegracaoPanel";
import { SerproIntegracaoPanel } from "../components/SerproIntegracaoPanel";
import { ContadorPanel } from "../components/ContadorPanel";
import { RfbIntegracaoPanel } from "../components/RfbIntegracaoPanel";
import { ChecklistModelosForm } from "../components/ChecklistModelosForm";
import { PreferenciasPrecificacaoForm } from "../components/PreferenciasPrecificacaoForm";
import {
  IconContador,
  IconIntegracoes,
  IconPastaIrpf,
  IconSerpro,
  IconWhatsApp,
} from "../components/ConfigMenuIcons";
import { IconConfig } from "../components/NavIcons";
import { MonitorFoldersForm } from "../components/MonitorFoldersForm";

export type ConfigMenuId =
  | "pasta"
  | "integracoes"
  | "preferencias"
  | "contador"
  | "conta-azul"
  | "asaas"
  | "rfb"
  | "serpro"
  | "whatsapp";

const INTEGRATION_TILES: ConfigMenuId[] = ["conta-azul", "asaas", "rfb", "serpro", "whatsapp"];

function isIntegrationTile(id: ConfigMenuId): boolean {
  return INTEGRATION_TILES.includes(id);
}

function tileIsActive(id: ConfigMenuId, focus: ConfigMenuId): boolean {
  if (focus === id) return true;
  if (id === "integracoes" && isIntegrationTile(focus)) return true;
  return false;
}

type TileDef =
  | { id: ConfigMenuId; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
  | { id: ConfigMenuId; label: string; brandLogoSrc: string };

const ROW1: TileDef[] = [
  { id: "pasta", label: "Pasta IRPF", Icon: IconPastaIrpf },
  { id: "integracoes", label: "Integrações", Icon: IconIntegracoes },
  { id: "preferencias", label: "Preferências", Icon: IconConfig },
  { id: "contador", label: "Contador", Icon: IconContador },
];

const ROW2: TileDef[] = [
  { id: "conta-azul", label: "Conta Azul", brandLogoSrc: contaAzulLogo },
  { id: "asaas", label: "Asaas", brandLogoSrc: asaasLogo },
  { id: "rfb", label: "API RFB", Icon: IconSerpro },
  { id: "serpro", label: "Serpro", Icon: IconSerpro },
  { id: "whatsapp", label: "WhatsApp", Icon: IconWhatsApp },
];

function ConfigTileIcon({ t }: { t: TileDef }) {
  if ("brandLogoSrc" in t) {
    return (
      <img
        src={t.brandLogoSrc}
        alt=""
        width={22}
        height={22}
        className="config-tile-brand-img"
        decoding="async"
      />
    );
  }
  return <t.Icon />;
}

type PreferenciasSub = "precificacao" | "checklists" | "outras";

export function ConfigPage() {
  const [focus, setFocus] = useState<ConfigMenuId>("pasta");
  const [prefSub, setPrefSub] = useState<PreferenciasSub>("precificacao");

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-title-with-icon">
          <span className="top-bar-page-icon" aria-hidden>
            <IconConfig />
          </span>
          <div>
            <h2>Configurações</h2>
            <p className="top-bar-meta">Parâmetros do sistema, pasta local e integrações.</p>
          </div>
        </div>
      </header>
      <main className="content-area">
        <div className="content-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ marginBottom: "0.85rem" }}>Áreas</h3>
          <div className="config-grid" style={{ marginBottom: "0.75rem" }}>
            {ROW1.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`config-tile${tileIsActive(t.id, focus) ? " active" : ""}`}
                onClick={() => setFocus(t.id)}
              >
                <span className="config-tile-inner">
                  <span className="config-tile-icon" aria-hidden>
                    <ConfigTileIcon t={t} />
                  </span>
                  <span className="config-tile-label">{t.label}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="config-grid">
            {ROW2.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`config-tile${tileIsActive(t.id, focus) ? " active" : ""}`}
                onClick={() => setFocus(t.id)}
              >
                <span className="config-tile-inner">
                  <span className="config-tile-icon" aria-hidden>
                    <ConfigTileIcon t={t} />
                  </span>
                  <span className="config-tile-label">{t.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {focus === "pasta" ? (
          <MonitorFoldersForm />
        ) : focus === "asaas" ? (
          <div className="content-card">
            <h3>Asaas</h3>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              Integração com a API Asaas: API Key, dias até ao vencimento após gerar a cobrança e ativação. A chave fica
              no servidor e não é devolvida no GET. Para criar cobranças, use <strong>Precificação e Cobrança</strong>.
            </p>
            <AsaasIntegracaoPanel />
          </div>
        ) : focus === "rfb" ? (
          <div className="content-card">
            <h3>API RFB</h3>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              Integração InfoSimples para diagnóstico fiscal (situação e pendências). Usa procuração outorgada por
              contribuinte e certificado digital do contador.
            </p>
            <RfbIntegracaoPanel />
          </div>
        ) : focus === "contador" ? (
          <div className="content-card">
            <h3>Contador</h3>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              Dados do profissional responsável e certificado digital A1 (PFX/P12) para integrações que usem procuração
              eletrónica (ex.: consultas à RFB).
            </p>
            <ContadorPanel />
          </div>
        ) : focus === "preferencias" ? (
          <div className="content-card">
            <h3>Preferências</h3>
            <div className="declaracoes-toolbar" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                style={
                  prefSub === "precificacao"
                    ? { borderColor: "var(--accent)", background: "var(--info-bg)" }
                    : undefined
                }
                onClick={() => setPrefSub("precificacao")}
              >
                Precificação
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                style={
                  prefSub === "checklists"
                    ? { borderColor: "var(--accent)", background: "var(--info-bg)" }
                    : undefined
                }
                onClick={() => setPrefSub("checklists")}
              >
                Checklists
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                style={
                  prefSub === "outras"
                    ? { borderColor: "var(--accent)", background: "var(--info-bg)" }
                    : undefined
                }
                onClick={() => setPrefSub("outras")}
              >
                Outras
              </button>
            </div>
            {prefSub === "precificacao" ? (
              <>
                <p className="monitor-hint">
                  Edite a <strong>tabela</strong> abaixo: cada linha corresponde a um tipo de precificação. Esses
                  valores alimentam o ecrã <strong>Precificação e Cobrança</strong> (exceto «personalizado», que usa o
                  valor guardado no cadastro do cliente; a linha «referência» é apenas orientativa).
                </p>
                <PreferenciasPrecificacaoForm />
              </>
            ) : prefSub === "checklists" ? (
              <>
                <p className="monitor-hint">
                  Defina modelos reutilizáveis de documentos que o cliente deve enviar. No menu{" "}
                  <strong>Documentos</strong>, atribua um modelo a cada cliente e partilhe o link do portal.
                </p>
                <ChecklistModelosForm />
              </>
            ) : (
              <p className="monitor-hint">
                Outras preferências globais podem ser ligadas a rotas <code className="mono-path">/api</code> e à
                tabela <code className="mono-path">app_kv</code>.
              </p>
            )}
          </div>
        ) : focus === "conta-azul" ? (
          <div className="content-card">
            <h3>Conta Azul</h3>
            <ContaAzulIntegracaoPanel />
          </div>
        ) : focus === "serpro" ? (
          <div className="content-card">
            <h3>Serpro</h3>
            <SerproIntegracaoPanel />
          </div>
        ) : (
          <div className="content-card">
            <h3>
              {ROW1.concat(ROW2).find((x) => x.id === focus)?.label ?? "Configuração"}
            </h3>
            <p className="monitor-hint">
              Painel detalhado desta área pode ser ligado às rotas{" "}
              <code className="mono-path">/api/integracoes/*</code> e às preferências guardadas em{" "}
              <code className="mono-path">app_kv</code>.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
