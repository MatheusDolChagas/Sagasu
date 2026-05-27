import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured, uploadCasePhoto } from '../lib/supabase';
import { getSocket } from '../lib/socket';
import GroupTypeBadge from '../components/GroupTypeBadge';
import {
  getGroupLabel,
  getMemberRoleLabel,
  getViewerGroupRoleLabel,
  memberRoleBadgeClass,
} from '../lib/groupDisplay';
import type { Group } from '../types';

type GroupDetail = Group & {
  case?: { id: string; title: string; userId?: string; status?: string };
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

type GroupMembersPayload = {
  groupId: string;
  members: GroupDetail['members'];
};

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return dateString;
  }
};

const sortCommentsAsc = (list: Comment[]) =>
  [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef(false);

  const canComment = useMemo(() => !!user, [user]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/groups/${id}`);
        if (res.data.success) {
          setGroup(res.data.data);
          setComments(
            sortCommentsAsc((res.data.data.comments ?? []) as Comment[]),
          );
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

  const markMessagesRead = async () => {
    if (!id) return;
    try {
      await api.post(`/groups/${id}/read`);
    } catch {
      // silêncio — não bloqueia o chat
    }
  };

  useEffect(() => {
    if (!id || !user || loading) return;
    void markMessagesRead();
  }, [id, user, loading, comments.length]);

  useEffect(() => {
    if (!id || !user) return;

    const socket = getSocket();
    socket.emit('group:subscribe', id);

    const onMessage = (payload: Comment) => {
      if (!payload?.id) return;
      setComments((prev) => {
        if (prev.some((c) => c.id === payload.id)) return prev;
        return sortCommentsAsc([...prev, payload]);
      });
      if (payload.user?.id && payload.user.id !== user.id) {
        void markMessagesRead();
      }
    };

    const onMembers = (payload: GroupMembersPayload) => {
      if (!payload?.groupId || payload.groupId !== id) return;
      setGroup((prev) => (prev ? { ...prev, members: payload.members ?? [] } : prev));
    };

    socket.on('group:message', onMessage);
    socket.on('group:members', onMembers);
    return () => {
      socket.emit('group:unsubscribe', id);
      socket.off('group:message', onMessage);
      socket.off('group:members', onMembers);
    };
  }, [id, user]);

  useEffect(() => {
    if (comments.length === 0) return;
    const behavior = initialScrollDoneRef.current ? 'smooth' : 'auto';
    scrollToBottom(behavior);
    initialScrollDoneRef.current = true;
  }, [comments]);

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
          const created = res.data.data as Comment;
          setComments((prev) =>
            prev.some((c) => c.id === created.id)
              ? prev
              : sortCommentsAsc([...prev, created]),
          );
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
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <GroupTypeBadge isPrivate={group.isPrivate} />
          </div>
          <h1 className="text-3xl font-bold text-dark tracking-tight">
            {getGroupLabel(group, user?.id)}
          </h1>
          {group.isPrivate ? (
            <p className="text-sm text-sky-800/90 dark:text-sky-200/90 mt-2 max-w-xl">
              Canal privado criado automaticamente entre o responsável pelo caso e o voluntário
              aprovado. Não aparece na lista pública nem aceita novos membros.
            </p>
          ) : (
            <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90 mt-2 max-w-xl">
              Grupo aberto para coordenar ações de busca. Outros voluntários do caso podem entrar
              pela página de grupos.
            </p>
          )}
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
        <div className="flex items-center gap-2 flex-wrap">
          {!group.isPrivate && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                group.isActive
                  ? 'bg-accent/20 text-dark border-accent/30'
                  : 'bg-amber-500/15 text-amber-900 border-amber-500/35 dark:text-amber-200'
              }`}
            >
              {group.isActive
                ? 'Grupo ativo'
                : group.case?.status && group.case.status !== 'ACTIVE'
                  ? 'Inativo — caso encerrado'
                  : 'Grupo inativo'}
            </span>
          )}
          <Link
            to="/groups"
            className="rounded-xl border border-border bg-card px-4 py-2 font-semibold text-dark hover:bg-muted-bg/80"
          >
            Voltar aos grupos
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section
          className={`lg:col-span-1 bg-card border rounded-2xl shadow-sm p-6 ${
            group.isPrivate ? 'border-sky-500/30' : 'border-border'
          }`}
        >
          <h2 className="text-lg font-semibold text-dark mb-1">Membros</h2>
          <p className="text-xs text-dark/60 mb-3">Atualiza em tempo real quando alguém entra ou sai.</p>
          {user && (
            <p className="text-xs text-dark/70 mb-3">
              Seu papel:&nbsp;
              <span className="font-semibold">
                {getViewerGroupRoleLabel(user.id, group) ?? '—'}
              </span>
            </p>
          )}
          {group.members && group.members.length > 0 ? (
            <ul className="space-y-3">
              {group.members.map((m) => {
                const roleLabel = getMemberRoleLabel(
                  m.user?.id,
                  m.role,
                  group.case?.userId,
                  group.leaderId,
                );
                return (
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
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${memberRoleBadgeClass(roleLabel)}`}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-dark/70 text-sm">Ainda não há membros neste grupo.</p>
          )}
        </section>

        <section className="lg:col-span-2 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[min(70vh,640px)]">
          <div className="shrink-0 border-b border-border px-4 py-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-dark">Conversa</h2>
              <p className="text-sm text-dark/70">
                Mensagens do grupo — as mais recentes aparecem embaixo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markMessagesRead()}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-dark hover:bg-muted-bg/80"
            >
              Marcar todas como lidas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted-bg/20">
            {comments.length === 0 ? (
              <p className="text-center text-dark/70 text-sm py-8">
                Nenhuma mensagem ainda. Envie a primeira abaixo.
              </p>
            ) : (
              comments.map((c) => {
                const isMine = user?.id === c.user?.id;
                return (
                  <div
                    key={c.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMine
                          ? 'bg-primary/25 border border-primary/30 rounded-br-md'
                          : 'bg-card border border-border rounded-bl-md'
                      }`}
                    >
                      {!isMine && (
                        <p className="text-xs font-semibold text-primary mb-0.5">
                          {c.user?.name ?? 'Membro'}
                        </p>
                      )}
                      {c.content ? (
                        <p className="text-dark/90 text-sm whitespace-pre-wrap">{c.content}</p>
                      ) : null}
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="mt-2 max-h-56 rounded-lg border border-border object-contain bg-muted-bg/30"
                        />
                      ) : null}
                      <p
                        className={`text-[10px] text-dark/50 mt-1 ${isMine ? 'text-right' : ''}`}
                      >
                        {formatDate(c.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} aria-hidden />
          </div>

          <form
            onSubmit={handleAddComment}
            className="shrink-0 border-t border-border bg-card p-4 space-y-2"
          >
            {commentImagePreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={commentImagePreview}
                  alt=""
                  className="h-16 w-16 rounded-md border border-border object-cover"
                />
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
            <div className="flex items-end gap-2">
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={2}
                className="flex-1 min-h-[44px] max-h-32 resize-y rounded-2xl border border-border bg-muted-bg/30 px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={canComment ? 'Mensagem' : 'Faça login para enviar.'}
                disabled={!canComment}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (canComment && (commentDraft.trim() || commentFile) && !commentSubmitting) {
                      handleAddComment(e as unknown as FormEvent);
                    }
                  }
                }}
              />
              {canComment ? (
                <label className="shrink-0 cursor-pointer rounded-full border border-border p-2.5 text-dark hover:bg-muted-bg/80">
                  <span className="sr-only">Anexar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setCommentFile(f);
                      setCommentImagePreview(URL.createObjectURL(f));
                    }}
                  />
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </label>
              ) : null}
              <button
                type="submit"
                disabled={!canComment || commentSubmitting || (!commentDraft.trim() && !commentFile)}
                className="shrink-0 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {commentSubmitting ? '…' : 'Enviar'}
              </button>
            </div>
            {!canComment ? (
              <Link to="/login" className="text-primary text-sm font-semibold hover:underline">
                Entrar para participar da conversa
              </Link>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}

