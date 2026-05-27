import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HiBellAlert, HiChatBubbleLeftRight, HiEye, HiUserGroup } from 'react-icons/hi2';
import api from '../services/api';
import { getSocket } from '../lib/socket';
import type { CaseFeedItem } from '../types';

type Props = {
  caseId: string;
  /** Dono do caso vê voluntários pendentes; demais usuários só aprovados */
  isOwner?: boolean;
};

export default function CaseFeed({ caseId, isOwner = false }: Props) {
  const [items, setItems] = useState<CaseFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/cases/${caseId}/feed`);
        if (!cancelled && res.data.success) {
          const raw = res.data.data as CaseFeedItem[];
          setItems(
            isOwner
              ? raw
              : raw.filter(
                  (row) =>
                    row.type !== 'VOLUNTEER' ||
                    row.status === 'APPROVED',
                ),
          );
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, isOwner]);

  useEffect(() => {
    const s = getSocket();
    s.emit('case:subscribe', caseId);

    const onFeed = (payload: CaseFeedItem) => {
      if (
        !isOwner &&
        payload.type === 'VOLUNTEER' &&
        payload.status !== 'APPROVED'
      ) {
        return;
      }
      setItems((prev) => {
        const dup = prev.some((p) => p.type === payload.type && p.id === payload.id);
        if (dup) return prev;
        const next = [payload, ...prev];
        next.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return next;
      });
    };

    s.on('case:feed', onFeed);
    return () => {
      s.emit('case:unsubscribe', caseId);
      s.off('case:feed', onFeed);
    };
  }, [caseId, isOwner]);

  const formatAt = (iso: string) => {
    try {
      return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return iso;
    }
  };

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-1">
        <HiBellAlert className="w-5 h-5 text-primary" />
        Atualizações do caso
      </h2>
      <p className="text-dark/70 text-sm mb-4">
        Linha do tempo com dicas, voluntários e avistamentos. Novos eventos aparecem aqui em tempo
        real.
      </p>

      {loading ? (
        <p className="text-sm text-dark/60">Carregando feed…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-dark/60">
          Ainda não há eventos públicos neste caso. Quando houver dicas, voluntários ou avistamentos,
          eles aparecerão aqui.
        </p>
      ) : (
        <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {items.map((row) => (
            <li
              key={`${row.type}-${row.id}`}
              className="flex gap-3 rounded-xl border border-border bg-muted-bg/35 p-3"
            >
              <div className="shrink-0 mt-0.5 text-primary">
                {row.type === 'TIP' && <HiChatBubbleLeftRight className="w-5 h-5" />}
                {row.type === 'VOLUNTEER' && <HiUserGroup className="w-5 h-5" />}
                {row.type === 'SIGHTING' && <HiEye className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-dark/60 mb-0.5">{formatAt(row.createdAt)}</p>
                {row.type === 'TIP' && (
                  <>
                    <p className="text-xs font-semibold text-dark uppercase tracking-wide">Dica</p>
                    <p className="text-sm text-dark/90 whitespace-pre-wrap break-words">
                      {row.preview}
                    </p>
                  </>
                )}
                {row.type === 'VOLUNTEER' && (
                  <>
                    <p className="text-xs font-semibold text-dark uppercase tracking-wide">
                      Voluntário
                    </p>
                    <p className="text-sm text-dark/90">
                      <span className="font-medium">{row.volunteerName}</span>
                      {' — '}
                      <span className="text-dark/80">
                        {row.status === 'PENDING' && 'aguardando aprovação'}
                        {row.status === 'APPROVED' && 'aprovado'}
                        {row.status === 'REJECTED' && 'não aprovado'}
                      </span>
                    </p>
                  </>
                )}
                {row.type === 'SIGHTING' && (
                  <>
                    <p className="text-xs font-semibold text-dark uppercase tracking-wide">
                      Avistamento
                    </p>
                    {row.description && (
                      <p className="text-sm text-dark/90 mb-2">{row.description}</p>
                    )}
                    <img
                      src={row.photoUrl}
                      alt=""
                      className="h-28 w-full max-w-xs rounded-lg border border-border object-cover"
                    />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
