import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: (user, token) => {
        set({ user, token });
        // Sincronizar com localStorage para compatibilidade com api.ts
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },

      logout: () => {
        set({ user: null, token: null });
        // Limpar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      initialize: () => {
        // O persist do Zustand já faz isso automaticamente,
        // mas mantemos para sincronizar com localStorage se necessário
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token });
          } catch (error) {
            console.error('Error parsing user:', error);
            set({ user: null, token: null });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// Helper para verificar autenticação
export const useIsAuthenticated = () => {
  const { user, token } = useAuthStore();
  return !!user && !!token;
};
