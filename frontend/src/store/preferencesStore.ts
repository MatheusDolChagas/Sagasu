import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScale = 'default' | 'large' | 'xlarge';

interface PreferencesState {
  theme: ThemeMode;
  fontScale: FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
  setTheme: (theme: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  setHighContrast: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
}

export function resolveDarkClass(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function applyPreferencesToDocument(state: {
  theme: ThemeMode;
  fontScale: FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
}): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolveDarkClass(state.theme));

  if (state.fontScale === 'default') {
    delete root.dataset.fontScale;
  } else {
    root.dataset.fontScale = state.fontScale;
  }

  root.classList.toggle('a11y-high-contrast', state.highContrast);
  root.classList.toggle('a11y-reduce-motion', state.reduceMotion);
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      fontScale: 'default',
      highContrast: false,
      reduceMotion: false,
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    {
      name: 'sagasu-preferences',
      partialize: (s) => ({
        theme: s.theme,
        fontScale: s.fontScale,
        highContrast: s.highContrast,
        reduceMotion: s.reduceMotion,
      }),
      onRehydrateStorage: () => (rehydrated, error) => {
        if (error || typeof document === 'undefined' || !rehydrated) return;
        applyPreferencesToDocument({
          theme: rehydrated.theme,
          fontScale: rehydrated.fontScale,
          highContrast: rehydrated.highContrast,
          reduceMotion: rehydrated.reduceMotion,
        });
      },
    }
  )
);
