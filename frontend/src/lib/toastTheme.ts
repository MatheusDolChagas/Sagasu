import type { DefaultToastOptions } from 'react-hot-toast';

/** Estilos alinhados ao tema claro/escuro da aplicação */
export const appToastOptions: DefaultToastOptions = {
  style: {
    background: 'var(--app-surface)',
    color: 'var(--app-text)',
    border: '1px solid var(--app-border)',
    boxShadow: '0 8px 24px rgb(0 0 0 / 0.18)',
    borderRadius: 'var(--radius)',
    maxWidth: 'min(420px, calc(100vw - 2rem))',
  },
  success: {
    iconTheme: {
      primary: 'var(--app-accent)',
      secondary: 'var(--app-surface)',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: 'var(--app-surface)',
    },
  },
};
