import { useLayoutEffect, type ReactNode } from 'react';
import {
  applyPreferencesToDocument,
  usePreferencesStore,
} from '@/store/preferencesStore';

function pickPrefs(s: ReturnType<typeof usePreferencesStore.getState>) {
  return {
    theme: s.theme,
    fontScale: s.fontScale,
    highContrast: s.highContrast,
    reduceMotion: s.reduceMotion,
  };
}

export default function PreferencesRoot({ children }: { children: ReactNode }) {
  const theme = usePreferencesStore((s) => s.theme);

  useLayoutEffect(() => {
    const sync = () => applyPreferencesToDocument(pickPrefs(usePreferencesStore.getState()));
    sync();
    return usePreferencesStore.subscribe(sync);
  }, []);

  useLayoutEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () =>
      applyPreferencesToDocument(pickPrefs(usePreferencesStore.getState()));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return <>{children}</>;
}
