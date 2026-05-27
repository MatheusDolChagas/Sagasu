import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured, uploadCasePhoto } from '../lib/supabase';
import type { Group } from '../types';

type GroupDetail = Group & {
  case?: { id: string; title: string };
  leader?: { id: string; name: string };
  members?: Array<{
    role: string;
    joinedAt: string;
    user?: { id: string; name: string; avatarUrl?: string | null };
  }>;
};

type Comment = {
  id: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  user?: { id: string; name: string; avatarUrl?: string | null };
};

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return dateString;
  }
};

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentDraft, setCommentDraft] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const canComment = useMemo(() => !!user, [user]);

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/groups/${id}`);
        if (res.data.success) {
          setGroup(res.data.data);
          setComments((res.data.data.comments ?? []) as Comment[]);
        }
        else setError('Não foi possível carregar o grupo.');
      } catch {
        setError('Erro ao carregar o grupo.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!commentDraft.trim() && !commentFile) return;
    setCommentSubmitting(true);
    void (async () => {
      try {
        let imageUrl: string | undefined;
        if (commentFile) {
          if (!isSupabaseConfigured()) {
            throw new Error('Envio de imagem indisponível no momento.');
          }
          imageUrl = await uploadCasePhoto(commentFile);
          const v = await api.post('/media/validate', { imageUrl, context: 'general' });
          if (!v.data?.success) {
            throw new Error(v.data?.message || 'Imagem não passou na validação.');
          }
        }

        const res = await api.post(`/groups/${id}/comments`, {
          content: commentDraft.trim() || undefined,
          imageUrl,
        });
        if (res.data.success) {
          setComments((prev) => [res.data.data as Comment, ...prev]);
          setCommentDraft('');
          setCommentFile(null);
          setCommentImagePreview(null);
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : err instanceof Error
              ? err.message
              : 'Não foi possível enviar comentário';
        alert(msg || 'Não foi possível enviar comentário');
      } finally {
        setCommentSubmitting(false);
      }
    })();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <p className="text-dark">Carregando grupo...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <p className="text-dark mb-6">{error ?? 'Grupo não encontrado.'}</p>
        <Link to="/groups" className="inline-flex items-center gap-2 bg-primary text-dark px-6 py-3 rounded-xl font-semibold ring-1 ring-primary/30 hover:opacity-95">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark tracking-tight">{group.name}</h1>
          <p className="text-dark/70 mt-1 text-sm">
            {group.case ? (
              <>
                Caso:&nbsp;
                <Link to={`/cases/${group.case.id}`} className="text-primary hover:underline font-semibold">
                  {group.case.title}
                </Link>
              </>
            ) : (
              'Caso vinculado'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
            group.isActive ? 'bg-accent/20 text-dark border-accent/30' : 'bg-muted/20 text-dark border-muted/30'
          }`}>
            {group.isActive ? 'Ativo' : 'Inativo'}
          </span>
          <Link
            to="/groups"
            className="rounded-xl border border-border bg-card px-4 py-2 font-semibold text-dark hover:bg-muted-bg/80"
          >
            Voltar aos grupos
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-card border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-dark mb-3">Membros</h2>
          {group.members && group.members.length > 0 ? (
            <ul className="space-y-3">
              {group.members.map((m) => (
                <li key={`${m.user?.id ?? 'x'}-${m.joinedAt}`} className="rounded-xl border border-border bg-muted-bg/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted-bg">
                        {m.user?.avatarUrl ? (
                          <img src={m.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted">
                            {(m.user?.name?.charAt(0) ?? 'M').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-dark">{m.user?.name ?? 'Membro'}</p>
                        <p className="text-xs text-dark/70 mt-1">
                          Entrou em: {formatDate(m.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      m.role === 'LEADER'
                        ? 'bg-primary/15 text-dark border-primary/30'
                        : 'bg-muted/15 text-dark border-muted/25'
                    }`}>
                      {m.role === 'LEADER' ? 'Líder' : 'Membro'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-dark/70 text-sm">Ainda não há membros neste grupo.</p>
          )}
        </section>

        <section className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-dark mb-3">Comentários</h2>
          <p className="text-sm text-dark/70 mb-4">
            Espaço para alinhar ações do grupo e registrar atualizações.
          </p>

          <form onSubmit={handleAddComment} className="mb-6 space-y-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={canComment ? 'Escreva um comentário...' : 'Faça login para comentar.'}
              disabled={!canComment}
            />
            {commentImagePreview ? (
              <div className="flex items-center gap-3">
                <img src={commentImagePreview} alt="" className="h-16 w-16 rounded-md border border-border object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCommentFile(null);
                    setCommentImagePreview(null);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Remover imagem
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              {!canComment ? (
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Entrar para comentar
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-dark/60">Dica: seja objetivo e informe horários/localizações.</span>
                  <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                    Anexar imagem
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setCommentFile(f);
                        const url = URL.createObjectURL(f);
                        setCommentImagePreview(url);
                      }}
                    />
                  </label>
                </div>
              )}
              <button
                type="submit"
                disabled={!canComment || commentSubmitting || (!commentDraft.trim() && !commentFile)}
                className="rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {commentSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-dark/70 text-sm">Nenhum comentário ainda.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-dark">{c.user?.name ?? 'Membro'}</p>
                      <p className="text-xs text-dark/60">{formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                  {c.content ? (
                    <p className="text-dark/90 text-sm mt-2 whitespace-pre-wrap">{c.content}</p>
                  ) : null}
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="mt-3 max-h-72 w-full rounded-lg border border-border object-contain bg-muted-bg/30"
                    />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

