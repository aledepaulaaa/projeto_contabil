# Mapa da Aplicação — Frontend (MONITOR_IRPF)

## 1. Arquitetura Geral
O frontend da sub-aplicação `MONITOR_IRPF` é desenvolvido com React, TypeScript e compilado/servido usando o bundler Vite.

* **Diretório Principal**: `MONITOR_IRPF/frontend/`
* **Layout & Estilização**: Baseado em CSS nativo (Vanilla CSS) para controle visual personalizado, sombras e transições.
* **Comunicação local**: O arquivo `vite.config.ts` estabelece um proxy para encaminhar todas as chamadas `/api/*` locais para o Uvicorn do backend executando na porta `8000`.

---

## 2. Estrutura de Pastas e Componentes

* **`src/interfaces`**: Definições de tipos e interfaces TypeScript:
  * **Conta Azul** (`IContaAzulConfig.ts`): Tipagem reativa do estado de autenticação + toggle de APIs habilitadas.
  * **SERPRO** (`ISerproConfig.ts`): Tipagem reativa para credenciais, certificados, chave privada e flag de sandbox do SERPRO.
  * **Outros**: Interfaces para Asaas (`IAsaasConfig.ts` - incluindo sandboxMode e chaves segregadas), RFB (`IRfbInfosimplesConfig.ts`), Contador (`IContadorConfig.ts`), etc.
* **`src/api`**: Cliente HTTP de comunicação com o backend (`client.ts`):
  * Métodos para Conta Azul, SERPRO, Asaas, RFB, declarações, clientes, DARF, etc.
  * Interfaces exportadas: `DadoRendaItem`, `ConsultaRendaResult`, `SerproChamarResult` (para chamadas e testes dinâmicos da SERPRO).
* **`src/components`**: Painéis reutilizáveis e formulários de configuração:
  * **Conta Azul** (`ContaAzulIntegracaoPanel.tsx`): OAuth 2.0 + teste de conexão + toggle de API de Cobranças.
  * **SERPRO** (`SerproIntegracaoPanel.tsx`): Configurações de credenciais, controle de sandbox, extração de chave RSA, e aba de testes interativa da Sandbox.
  * **RFB** (`RfbIntegracaoPanel.tsx`): Config InfoSimples / diagnóstico fiscal.
  * **Asaas** (`AsaasIntegracaoPanel.tsx`): Config de cobranças e chaves segregadas (produção vs sandbox).
  * **Contador** (`ContadorPanel.tsx`): Perfil + upload de certificado A1.
  * **`NavIcons.tsx`**: Ícones SVG inline — incluindo `IconSerpro`.
  * **`AppShell.tsx`**: Layout principal com sidebar de navegação + Outlet.
* **`src/pages`**: Views completas:
  * Todas as páginas listadas abaixo, cada uma correspondendo a uma rota.

---

## 3. Rotas e Páginas

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `DashboardPage` | Métricas agregadas da carteira |
| `/declaracoes` | `DeclaracoesPage` | Listagem e status de declarações por CPF |
| `/usuarios` | `UsuariosPage` | Gestão de usuários do escritório |
| `/clientes` | `ClientesPage` | Carteira de clientes com precificação |
| `/documentos` | `DocumentosPage` | Checklist de documentos por cliente |
| `/procuracoes` | `ProcuracoesPage` | Status de procurações e-CAC |
| `/precificacao` | `PrecificacaoCobrancaPage` | Honorários e emissão de cobranças Asaas |
| `/darf` | `DarfPage` | Emissão e histórico de DARFs |
| `/malha` | `MalhaPage` | Malha fiscal por contribuinte |
| `/restituicoes` | `RestituicoesPage` | Lotes e status de restituição IRPF |
| `/diagnostico-fiscal` | `DiagnosticoFiscalPage` | Diagnóstico completo RFB por CPF |
| `/mensagens-ecac` | `MensagensEcacPage` | Caixa de mensagens e-CAC por contribuinte |
| `/insights` | `InsightsPage` | Relatórios analíticos por CPF |
| `/configuracoes` | `ConfigPage` | Integrações + perfil do contador |
| `/enviar-documentos/:token` | `PortalClienteDocumentosPage` | Portal público de envio de documentos |

---

## 4. Infraestrutura & Deploy
* **Hospedagem (Vercel)**: Aplicação hospedada no Vercel como um Single Page Application (SPA).
* **Roteamento & Proxy**: Configurado em `vercel.json` para realizar reescritas de URL (`rewrites`), redirecionando requisições do endpoint `/api/*` em produção para o serviço correspondente hospedado no Render, além de prover fallback automático para `index.html`.

