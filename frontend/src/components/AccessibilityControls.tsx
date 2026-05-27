import type { ReactNode } from 'react';
import { HiComputerDesktop, HiMoon, HiSun } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { FontScale, ThemeMode } from '@/store/preferencesStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { cn } from '@/lib/utils';

type Props = {
  /** Espaçamento reduzido quando embutido no menu de perfil */
  compact?: boolean;
  className?: string;
};

export default function AccessibilityControls({ compact, className }: Props) {
  const theme = usePreferencesStore((s) => s.theme);
  const fontScale = usePreferencesStore((s) => s.fontScale);
  const highContrast = usePreferencesStore((s) => s.highContrast);
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setFontScale = usePreferencesStore((s) => s.setFontScale);
  const setHighContrast = usePreferencesStore((s) => s.setHighContrast);
  const setReduceMotion = usePreferencesStore((s) => s.setReduceMotion);

  const themeBtn = (value: ThemeMode, icon: ReactNode, label: string) => (
    <Button
      type="button"
      variant={theme === value ? 'secondary' : 'outline'}
      size="sm"
      className="flex-1 gap-1 px-1.5 text-[11px] sm:px-2 sm:text-xs"
      onClick={() => setTheme(value)}
      aria-pressed={theme === value}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Button>
  );

  const scaleBtn = (value: FontScale, label: string) => (
    <Button
      type="button"
      variant={fontScale === value ? 'secondary' : 'outline'}
      size="sm"
      className="flex-1 text-[11px] sm:text-xs"
      onClick={() => setFontScale(value)}
      aria-pressed={fontScale === value}
    >
      {label}
    </Button>
  );

  return (
    <div
      className={cn(compact ? 'space-y-2' : 'space-y-3', className)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Tema
        </p>
        <div className="flex gap-1">
          {themeBtn('light', <HiSun className="h-3.5 w-3.5 shrink-0" aria-hidden />, 'Claro')}
          {themeBtn('dark', <HiMoon className="h-3.5 w-3.5 shrink-0" aria-hidden />, 'Escuro')}
          {themeBtn(
            'system',
            <HiComputerDesktop className="h-3.5 w-3.5 shrink-0" aria-hidden />,
            'Sistema',
          )}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Texto
        </p>
        <div className="flex gap-1">
          {scaleBtn('default', 'Padrão')}
          {scaleBtn('large', 'Grande')}
          {scaleBtn('xlarge', 'Maior')}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="cursor-pointer text-xs font-normal">Contraste alto</Label>
          <Button
            type="button"
            role="switch"
            aria-checked={highContrast}
            variant={highContrast ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 min-w-[2.75rem] text-xs"
            onClick={() => setHighContrast(!highContrast)}
          >
            {highContrast ? 'Sim' : 'Não'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label className="cursor-pointer text-xs font-normal">Menos animações</Label>
          <Button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            variant={reduceMotion ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 min-w-[2.75rem] text-xs"
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            {reduceMotion ? 'Sim' : 'Não'}
          </Button>
        </div>
      </div>

      {!compact ? (
        <p className="text-[10px] leading-snug text-muted">
          O sistema também respeita a preferência de movimento do seu dispositivo.
        </p>
      ) : null}
    </div>
  );
}
