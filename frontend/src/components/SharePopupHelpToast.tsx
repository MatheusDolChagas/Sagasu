import toast from 'react-hot-toast';
import { POPUP_HELP_STEPS } from '../lib/socialShare';

export function showShareCopiedToast(network: string, copied: boolean) {
  if (copied) {
    toast.success(
      `Abrindo ${network}. O texto completo foi copiado — cole no post com Ctrl+V (ou Cmd+V no Mac).`,
      { duration: 8000 },
    );
    return;
  }
  toast(
    `Abrindo ${network}. Se o texto não aparecer, use “Copiar link” e cole a mensagem manualmente.`,
    { duration: 7000 },
  );
}

export function showPopupBlockedHelp(network: string) {
  toast(
    (t) => (
      <div className="text-sm leading-snug max-w-sm" style={{ color: 'var(--app-text)' }}>
        <p className="font-semibold mb-2">Não foi possível abrir o {network}</p>
        <p className="mb-2 text-[var(--app-text-muted)]">
          O navegador pode estar bloqueando novas abas. Para permitir:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs mb-3">
          {POPUP_HELP_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-xs text-[var(--app-text-muted)]">
          No Firefox: ícone de escudo → “Desbloquear pop-ups”. No Safari: Ajustes do site →
          Pop-ups → Permitir.
        </p>
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-primary hover:underline"
          onClick={() => toast.dismiss(t.id)}
        >
          Entendi
        </button>
      </div>
    ),
    { duration: 12000 },
  );
}
