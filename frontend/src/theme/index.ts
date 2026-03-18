// Padrões visuais centralizados para manter o Design System fiel ao Glassmorphism

export const theme = {
  colors: {
    background: {
      from: 'slate-950', // base gradient start
      to: 'slate-900',   // base gradient end
    },
    primary: 'blue-500', // Ações principais
    success: 'emerald-500', // Quitados/assinados
    alert: 'amber-500', // Pendências
    text: {
      primary: 'slate-100',
      secondary: 'slate-300',
      muted: 'slate-400',
    }
  },
  glass: {
    base: 'bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    card: 'glass-card', // usa a classe do index.css
    input: 'bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl transition-all',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-blue-500/20',
  },
  typography: {
    title: 'font-display font-bold',
    body: 'font-sans',
  }
};
