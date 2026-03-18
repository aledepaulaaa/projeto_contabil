⚛️ Frontend UI: Reactive & High-Fidelity (React + Vite)
🎨 1. Design System & UX (2026 Trends)
Interface focada em Glassmorphism, layouts fluidos e assistência por IA.

Tipografia: Hierarquia com Manrope (Títulos) e Inter (Textos).

Visual: Uso de backdrop-blur, sombras suaves e bordas finas.

Ícones: Exclusivamente Lucide React. (Proibido o uso de emojis na interface).

Animações: Framer Motion para transições de status e feedbacks fluidos.

Responsividade Extrema: Layout 100% responsivo, com foco Mobile-First. O menor breakpoint deve atender dispositivos de 320px de largura (ex: iPhone 4s/SE), garantindo usabilidade total em telas pequenas.

🎨 2. Paleta de Cores e Estilos Padrão
Background Base: Gradiente profundo de slate-950 para slate-900.

Glass Card:

background: rgba(255, 255, 255, 0.05).

backdrop-filter: blur(12px).

border: 1px solid rgba(255, 255, 255, 0.1).

shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37).

Cores de Destaque:

Primária: #3B82F6 (Blue 500) para ações principais.

Sucesso: #10B981 (Emerald 500) para itens quitados/assinados.

Alerta: #F59E0B (Amber 500) para pendências e prazos.

⚡ 3. Reatividade e Estado SaaS
Zustand (Global State): Gerencia authStore, planStore (Paywall) e sidebarStore.

Real-time: WebSockets para atualizações de status em tempo real.

Atomic Design: Reutilização rigorosa de componentes (Atoms -> Molecules -> Organisms).

🛡️ 4. Engenharia de Frontend & Performance
Playwright E2E: Testes cobrindo fluxos críticos de negócio.

PWA: Suporte a Push Notifications via Firebase (FCM).

Segurança: Sanitização ativa e CSP configurada.

Performance: Plugin vite-plugin-pwa para carregamento instantâneo (< 1s).

🔧 5. Configuração Técnica: tailwind.config.ts
export default {
  theme: {
    extend: {
      screens: {
        'xs': '320px', // Suporte a dispositivos ultra-pequenos
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
}