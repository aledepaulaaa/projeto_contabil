import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ClientesPage } from "./pages/ClientesPage";
import { ConfigPage } from "./pages/ConfigPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentosPage } from "./pages/DocumentosPage";
import { PortalClienteDocumentosPage } from "./pages/PortalClienteDocumentosPage";
import { DeclaracoesPage } from "./pages/DeclaracoesPage";
import { DarfPage } from "./pages/DarfPage";
import { MalhaPage } from "./pages/MalhaPage";
import { RestituicoesPage } from "./pages/RestituicoesPage";
import { DiagnosticoFiscalPage } from "./pages/DiagnosticoFiscalPage";
import { MensagensEcacPage } from "./pages/MensagensEcacPage";
import { InsightsPage } from "./pages/InsightsPage";
import { PrecificacaoCobrancaPage } from "./pages/PrecificacaoCobrancaPage";
import { ProcuracoesPage } from "./pages/ProcuracoesPage";
import { UsuariosPage } from "./pages/UsuariosPage";

export default function App() {
  return (
    <Routes>
      <Route path="/enviar-documentos/:token" element={<PortalClienteDocumentosPage />} />
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="declaracoes" element={<DeclaracoesPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="documentos" element={<DocumentosPage />} />
        <Route path="procuracoes" element={<ProcuracoesPage />} />
        <Route path="precificacao" element={<PrecificacaoCobrancaPage />} />
        <Route path="darf" element={<DarfPage />} />
        <Route path="malha" element={<MalhaPage />} />
        <Route path="restituicoes" element={<RestituicoesPage />} />
        <Route path="diagnostico-fiscal" element={<DiagnosticoFiscalPage />} />
        <Route path="mensagens-ecac" element={<MensagensEcacPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="configuracoes" element={<ConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
