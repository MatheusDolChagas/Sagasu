import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../lib/socket';
import GroupTypeBadge from '../components/GroupTypeBadge';
import {
  getGroupLabel,
  getMemberRoleLabel,
  getViewerGroupRoleLabel,
  memberRoleBadgeClass,
} from '../lib/groupDisplay';
import type { Group } from '../types';

type GroupMembersPayload = {
  groupId: string;
  members?: Group['members'];
};

export default function Groups() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [caseId, setCaseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [caseOptions, setCaseOptions] = useState<
    Array<{ id: string; title: string; label: string; status?: string }>
  >([]);
  const [caseOptionsLoading, setCaseOptionsLoading] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [discoverableGroups, setDiscoverableGroups] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      isActive: boolean;
      caseId: string;
      leader?: { id: string; name: string };
      case?: { id: string; title: string };
      _count?: { members: number };
    }>
  >([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [unreadByGroup, setUnreadByGroup] = useState<Record<string, number>>({});
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupsAndOptions = async () => {
      setLoading(true);
      setError(null);
      setCaseOptionsLoading(true);
      try {
        const [groupsRes, casesRes, volunteersRes] = await Promise.all([
          api.get('/groups/my'),
          api.get('/cases/my/list'),
          api.get('/volunteers/my'),
        ]);

        if (groupsRes.data.success) {
          const loaded = groupsRes.data.data as Group[];
          setGroups(loaded);
          const counts: Record<string, number> = {};
          loaded.forEach((g) => {
            if (g.unreadCount && g.unreadCount > 0) counts[g.id] = g.unreadCount;
          });
          setUnreadByGroup(counts);
        } else {
          setError('Não foi possível carregar seus grupos.');
        }

        const options = new Map<
          string,
          { id: string; title: string; label: string; status?: string }
        >();

        if (casesRes.data?.success && Array.isArray(casesRes.data.data)) {
          casesRes.data.data.forEach((c: any) => {
            if (!c?.id || !c?.title) return;
            options.set(c.id, {
              id: c.id,
              title: c.title,
              label: `Meu caso: ${c.title}`,
              status: c.status,
            });
          });
        }

        if (volunteersRes.data?.success && Array.isArray(volunteersRes.data.data)) {
          volunteersRes.data.data
            .filter((v: any) => v?.status === 'APPROVED' && v?.case?.id && v?.case?.title)
            .forEach((v: any) => {
              const cid = v.case.id;
              if (!options.has(cid)) {
                options.set(cid, {
                  id: cid,
                  title: v.case.title,
                  label: `Voluntário aprovado: ${v.case.title}`,
                  status: v.case.status,
                });
              }
            });
        }

        const optionsList = Array.from(options.values());
        setCaseOptions(optionsList);

        const activeOptions = optionsList.filter(
          (c) => c.status === 'ACTIVE' || !c.status,
        );

        if (activeOptions.length > 0) {
          setDiscoverLoading(true);
          const caseGroupsResults = await Promise.all(
            activeOptions.map((c) => api.get(`/groups/case/${c.id}`)),
          );
          const myIds = new Set(
            groupsRes.data.success
              ? (groupsRes.data.data as Group[]).map((g: Group) => g.id)
              : [],
          );
          const discovered = new Map<string, (typeof discoverableGroups)[number]>();
          caseGroupsResults.forEach((res, idx) => {
            if (!res.data?.success || !Array.isArray(res.data.data)) return;
            const caseTitle = activeOptions[idx]?.title;
            res.data.data.forEach((g: (typeof discoverableGroups)[number] & { isPrivate?: boolean }) => {
              if (!g?.id || !g.isActive || g.isPrivate || myIds.has(g.id)) return;
              discovered.set(g.id, {
                ...g,
                case: g.case ?? { id: activeOptions[idx].id, title: caseTitle },
              });
            });
          });
          setDiscoverableGroups(Array.from(discovered.values()));
        } else {
          setDiscoverableGroups([]);
        }
      } catch {
        setError('Erro ao carregar grupos ou casos.');
      } finally {
        setLoading(false);
        setCaseOptionsLoading(false);
        setDiscoverLoading(false);
      }
    };

    if (user) {
      fetchGroupsAndOptions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const searchGroups = useMemo(
    () => groups.filter((g) => !g.isPrivate),
    [groups],
  );
  const contactGroups = useMemo(
    () => groups.filter((g) => g.isPrivate),
    [groups],
  );

  const filteredContactGroups = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contactGroups;
    return contactGroups.filter((g) => {
      const label = getGroupLabel(g, user?.id).toLowerCase();
      const caseTitle = g.case?.title?.toLowerCase() ?? '';
      const person = g.case?.missingPersonName?.toLowerCase() ?? '';
      const members = (g.members ?? [])
        .map((m) => m.user?.name?.toLowerCase() ?? '')
        .join(' ');
      return (
        label.includes(q) ||
        caseTitle.includes(q) ||
        person.includes(q) ||
        members.includes(q)
      );
    });
  }, [contactGroups, contactSearch, user?.id]);

  const activeCaseOptions = useMemo(
    () => caseOptions.filter((c) => c.status === 'ACTIVE' || !c.status),
    [caseOptions],
  );

  const CASE_STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Caso ativo',
    FOUND: 'Pessoa encontrada',
    CLOSED: 'Caso cancelado',
    ARCHIVED: 'Arquivado',
  };

  const watchedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    groups.forEach((g) => ids.add(g.id));
    discoverableGroups.forEach((g) => ids.add(g.id));
    return Array.from(ids);
  }, [groups, discoverableGroups]);

  useEffect(() => {
    if (!user || watchedGroupIds.length === 0) return;

    const socket = getSocket();
    watchedGroupIds.forEach((gid) => socket.emit('group:subscribe', gid));

    const onMembers = (payload: GroupMembersPayload) => {
      if (!payload?.groupId) return;
      const count = payload.members?.length ?? 0;
      setGroups((prev) =>
        prev.map((g) =>
          g.id === payload.groupId ? { ...g, members: payload.members } : g,
        ),
      );
      setDiscoverableGroups((prev) =>
        prev.map((g) =>
          g.id === payload.groupId ? { ...g, _count: { members: count } } : g,
        ),
      );
    };

    const onUnread = (payload: { groupId?: string; unreadCount?: number }) => {
      if (!payload?.groupId || payload.unreadCount == null) return;
      setUnreadByGroup((prev) => ({ ...prev, [payload.groupId!]: payload.unreadCount! }));
    };

    socket.on('group:members', onMembers);
    socket.on('group:unread', onUnread);
    return () => {
      watchedGroupIds.forEach((gid) => socket.emit('group:unsubscribe', gid));
      socket.off('group:members', onMembers);
      socket.off('group:unread', onUnread);
    };
  }, [user, watchedGroupIds]);

  const getUnread = (groupId: string) => unreadByGroup[groupId] ?? 0;

  const handleMarkGroupRead = async (groupId: string) => {
    setMarkingReadId(groupId);
    try {
      const res = await api.post(`/groups/${groupId}/read`);
      if (res.data.success) {
        const count = res.data.data?.unreadCount ?? 0;
        setUnreadByGroup((prev) => ({ ...prev, [groupId]: count }));
      }
    } catch {
      alert('Não foi possível marcar as mensagens como lidas.');
    } finally {
      setMarkingReadId(null);
    }
  };

  const renderChatUnread = (groupId: string) => {
    const unread = getUnread(groupId);
    if (unread <= 0) return null;
    return (
      <span className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
        {unread > 99 ? '99+' : unread}
      </span>
    );
  };

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroupId(groupId);
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      if (res.data.success) {
        const joined = discoverableGroups.find((g) => g.id === groupId);
        setDiscoverableGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (joined) {
          const detail = await api.get(`/groups/${groupId}`);
          if (detail.data.success) {
            setGroups((prev) => [detail.data.data as Group, ...prev]);
          }
        }
      }
    } catch {
      alert('Não foi possível entrar no grupo. Ele pode estar inativo ou ser privado.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleCreateGroup = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !caseId.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
        caseId: caseId.trim(),
      });
      if (res.data.success) {
        setGroups((prev) => [
          { ...(res.data.data as Group), isPrivate: false },
          ...prev,
        ]);
        setName('');
        setDescription('');
        setCaseId('');
      }
    } catch {
      alert('Não foi possível criar o grupo. Verifique o caso selecionado e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditDescription(group.description ?? '');
    setEditIsActive(group.isActive);
  };

  const cancelEditGroup = () => {
    setEditingGroupId(null);
    setEditName('');
    setEditDescription('');
    setEditIsActive(true);
  };

  const handleSaveEditGroup = async (groupId: string) => {
    if (!editName.trim()) return;
    setEditingSubmitting(true);
    try {
      const res = await api.put(`/groups/${groupId}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        isActive: editIsActive,
      });

      if (res.data.success) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, name: editName.trim(), description: editDescription.trim() || undefined, isActive: editIsActive } : g,
          ),
        );
        cancelEditGroup();
      }
    } catch {
      alert('Não foi possível atualizar o grupo.');
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const ok = confirm('Tem certeza que deseja remover este grupo?');
    if (!ok) return;
    setEditingSubmitting(true);
    try {
      const res = await api.delete(`/groups/${groupId}`);
      if (res.data.success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (editingGroupId === groupId) cancelEditGroup();
      }
    } catch {
      alert('Não foi possível remover o grupo.');
    } finally {
      setEditingSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-4 text-dark">Grupos de Busca</h1>
        <p className="text-dark mb-4">
          Para ver e criar grupos de busca, você precisa estar logado.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  const renderSearchGroupCard = (group: Group) => {
    const caseOwnerId = group.case?.userId;
    const viewerRole = getViewerGroupRoleLabel(user?.id, group);
    const isGroupLeader = group.leaderId === user?.id;
    const caseClosed = group.case?.status && group.case.status !== 'ACTIVE';

    return (
      <li
        key={group.id}
        className={`border rounded-2xl px-4 py-3 text-sm bg-card ${
          !group.isActive ? 'border-muted/40 opacity-90' : 'border-emerald-500/25'
        }`}
      >
        <div className="flex justify-between items-start gap-3 mb-1 flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/groups/${group.id}`} className="font-semibold text-dark hover:underline">
              {getGroupLabel(group, user?.id)}
            </Link>
            {renderChatUnread(group.id)}
            <GroupTypeBadge isPrivate={false} />
          </div>
          {!group.isActive && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/35 dark:text-amber-200">
              {caseClosed ? 'Inativo — caso encerrado' : 'Inativo'}
            </span>
          )}
        </div>
        {group.description && (
          <p className="text-dark/80 text-xs mb-1">{group.description}</p>
        )}
        {group.case && (
          <p className="text-dark/70 text-xs">
            Caso:&nbsp;
            <Link
              to={`/cases/${group.case.id}`}
              className="text-primary font-medium hover:underline"
            >
              {group.case.title}
            </Link>
          </p>
        )}
        <p className="text-dark/60 text-xs mt-2">
          Seu papel:&nbsp;
          <span className="font-medium">{viewerRole ?? '—'}</span>
          {group.members && group.members.length > 0 && (
            <> · {group.members.length} membro(s)</>
          )}
        </p>
        {group.members && group.members.length > 0 && (
          <ul className="mt-2 space-y-1">
            {group.members.map((m) => {
              const roleLabel = getMemberRoleLabel(
                m.user?.id,
                m.role,
                caseOwnerId,
                group.leaderId,
              );
              return (
                <li key={`${m.user?.id ?? m.joinedAt}-${m.role}`}>
                  <span className="text-dark/80 text-xs">
                    {m.user?.name ?? 'Membro'}{' '}
                    <span className="text-dark/60">({roleLabel})</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            to={`/groups/${group.id}`}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-fg hover:opacity-95"
          >
            Abrir conversa
          </Link>
          {getUnread(group.id) > 0 && (
            <button
              type="button"
              onClick={() => handleMarkGroupRead(group.id)}
              disabled={markingReadId === group.id}
              className="rounded border border-border bg-card px-3 py-1 text-xs text-dark hover:bg-muted-bg/80 disabled:opacity-60"
            >
              {markingReadId === group.id ? 'Marcando…' : 'Marcar todas como lidas'}
            </button>
          )}
        </div>
        {isGroupLeader && (
          editingGroupId === group.id ? (
            <div className="mt-3 rounded-lg border border-border bg-card p-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">Nome</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">Descrição</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-dark/80">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="rounded border-primary/40 text-primary focus:ring-primary"
                    />
                    Ativo
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEditGroup(group.id)}
                      disabled={editingSubmitting}
                      className="rounded bg-zinc-900 px-3 py-1 text-xs text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      {editingSubmitting ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditGroup}
                      disabled={editingSubmitting}
                      className="rounded border border-border bg-card px-3 py-1 text-xs text-dark hover:bg-muted-bg/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => startEditGroup(group)}
                className="rounded border border-border bg-card px-3 py-1 text-xs text-dark hover:bg-muted-bg/80"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGroup(group.id)}
                disabled={editingSubmitting}
                className="rounded bg-zinc-900 px-3 py-1 text-xs text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Remover
              </button>
            </div>
          )
        )}
      </li>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-dark">Grupos e contatos</h1>
      <p className="text-dark/75 text-sm mb-8 max-w-2xl">
        <strong className="text-dark">Grupos de busca</strong> são abertos para voluntários coordenarem
        ações no caso. <strong className="text-dark">Contatos salvos</strong> são canais privados
        criados automaticamente entre o responsável pelo caso e cada voluntário aprovado.
      </p>

      <section className="bg-card rounded-2xl border border-sky-500/30 shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-dark">Contatos salvos</h2>
          <GroupTypeBadge isPrivate />
        </div>
        <p className="text-sm text-dark/80 mb-4">
          Conversas privadas vinculadas ao caso. Permanecem aqui mesmo após o caso ser finalizado
          ou cancelado. Criadas automaticamente ao aprovar um voluntário.
        </p>
        {contactGroups.length > 0 && (
          <div className="mb-4">
            <label htmlFor="contactSearch" className="sr-only">
              Pesquisar contatos
            </label>
            <input
              id="contactSearch"
              type="search"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Pesquisar por nome, caso ou pessoa desaparecida..."
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
        {loading ? (
          <p className="text-dark/70 text-sm">Carregando...</p>
        ) : contactGroups.length === 0 ? (
          <p className="text-dark/70 text-sm">Nenhum contato salvo ainda.</p>
        ) : filteredContactGroups.length === 0 ? (
          <p className="text-dark/70 text-sm">Nenhum contato corresponde à pesquisa.</p>
        ) : (
          <ul className="space-y-3">
            {filteredContactGroups.map((group) => (
              <li
                key={group.id}
                className="border border-sky-500/25 rounded-2xl px-4 py-3 text-sm bg-sky-500/5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Link to={`/groups/${group.id}`} className="font-semibold text-dark hover:underline">
                    {getGroupLabel(group, user?.id)}
                  </Link>
                  {renderChatUnread(group.id)}
                  <GroupTypeBadge isPrivate />
                </div>
                {group.case && (
                  <div className="text-dark/70 text-xs space-y-1">
                    <p>
                      Caso:{' '}
                      <Link
                        to={`/cases/${group.case.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {group.case.title}
                      </Link>
                    </p>
                    {group.case.status && group.case.status !== 'ACTIVE' && (
                      <span className="inline-flex rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-200">
                        {CASE_STATUS_LABEL[group.case.status] ?? group.case.status}
                      </span>
                    )}
                  </div>
                )}
                {group.members && (
                  <p className="text-dark/60 text-xs mt-2">
                    {group.members.length} participante(s)
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/groups/${group.id}`}
                    className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:opacity-95 dark:bg-sky-500"
                  >
                    Abrir conversa
                  </Link>
                  {getUnread(group.id) > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMarkGroupRead(group.id)}
                      disabled={markingReadId === group.id}
                      className="rounded border border-border bg-card px-3 py-1 text-xs text-dark hover:bg-muted-bg/80 disabled:opacity-60"
                    >
                      {markingReadId === group.id ? 'Marcando…' : 'Marcar todas como lidas'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card rounded-2xl border border-emerald-500/30 shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-dark">Criar grupo de busca</h2>
          <GroupTypeBadge isPrivate={false} />
        </div>
        <p className="text-sm text-dark/80 mb-4">
          Escolha um dos seus casos para criar um grupo de busca específico para ele.
        </p>
        <form onSubmit={handleCreateGroup} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Nome do grupo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Grupo de busca - Bairro Centro"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Caso
            </label>
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
              required
              disabled={caseOptionsLoading || activeCaseOptions.length === 0}
            >
              <option value="">
                {caseOptionsLoading
                  ? 'Carregando casos...'
                  : activeCaseOptions.length === 0
                    ? 'Sem casos ativos para novo grupo'
                    : 'Selecione um caso'}
              </option>
              {activeCaseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Explique o objetivo do grupo, ponto de encontro, horários, etc."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? 'Criando...' : 'Criar grupo'}
          </button>
        </form>
      </section>

      <section className="bg-card rounded-2xl border border-emerald-500/20 shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-dark">Grupos de busca disponíveis</h2>
          <GroupTypeBadge isPrivate={false} />
        </div>
        <p className="text-sm text-dark/80 mb-4">
          Grupos abertos nos casos em que você participa. A lista de membros atualiza em tempo real.
        </p>
        {discoverLoading ? (
          <p className="text-dark/70 text-sm">Carregando grupos disponíveis...</p>
        ) : discoverableGroups.length === 0 ? (
          <p className="text-dark/70 text-sm">
            Nenhum grupo público disponível para entrar no momento.
          </p>
        ) : (
          <ul className="space-y-3">
            {discoverableGroups.map((group) => (
              <li
                key={group.id}
                className="border border-border rounded-2xl px-4 py-3 text-sm bg-card flex flex-wrap justify-between items-start gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-dark">{group.name}</p>
                    <GroupTypeBadge isPrivate={false} />
                  </div>
                  {group.description && (
                    <p className="text-dark/80 text-xs mt-1">{group.description}</p>
                  )}
                  {group.case && (
                    <p className="text-dark/70 text-xs mt-1">
                      Caso: {group.case.title}
                    </p>
                  )}
                  {group.leader && (
                    <p className="text-dark/60 text-xs mt-1">
                      Líder: {group.leader.name}
                      {group._count?.members != null && ` · ${group._count.members} membro(s)`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleJoinGroup(group.id)}
                  disabled={joiningGroupId === group.id}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-fg hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joiningGroupId === group.id ? 'Entrando...' : 'Entrar no grupo'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card rounded-2xl border border-emerald-500/30 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-dark">Meus grupos de busca</h2>
          <GroupTypeBadge isPrivate={false} />
        </div>
        {loading ? (
          <p className="text-dark/70 text-sm">Carregando grupos...</p>
        ) : error ? (
          <p className="text-red-700 text-sm">{error}</p>
        ) : searchGroups.length === 0 ? (
          <p className="text-dark/70 text-sm">
            Você ainda não participa de nenhum grupo de busca.
          </p>
        ) : (
          <ul className="space-y-3">{searchGroups.map(renderSearchGroupCard)}</ul>
        )}
      </section>
    </div>
  );
}
