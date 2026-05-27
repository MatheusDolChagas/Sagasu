import { useEffect, useRef } from 'react';
import { HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={() => !loading && onCancel()}
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-muted-bg/80 hover:text-dark disabled:opacity-50"
          aria-label="Fechar"
        >
          <HiXMark className="h-5 w-5" />
        </button>

        <div className="flex gap-4 pr-8">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              variant === 'danger'
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                : 'bg-sky-500/20 text-sky-800 dark:text-sky-200',
            )}
          >
            <HiExclamationTriangle className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-dark">
              {title}
            </h2>
            <div className="mt-2 text-sm text-dark/80 leading-relaxed">{description}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-dark hover:bg-muted-bg/80 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60',
              variant === 'danger'
                ? 'bg-amber-700 hover:opacity-95 dark:bg-amber-600'
                : 'bg-zinc-900 hover:opacity-95 dark:bg-zinc-100 dark:text-zinc-900',
            )}
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
