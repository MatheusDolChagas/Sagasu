import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Group } from '../types';

export default function Groups() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [caseId, setCaseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [caseOptions, setCaseOptions] = useState<Array<{ id: string; title: string; label: string }>>([]);
  const [caseOptionsLoading, setCaseOptionsLoading] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editingSubmitting, setEditingSubmitting] = useState(false);

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
          setGroups(groupsRes.data.data);
        } else {
          setError('Não foi possível carregar seus grupos.');
        }

        const options = new Map<string, { id: string; title: string; label: string }>();

        if (casesRes.data?.success && Array.isArray(casesRes.data.data)) {
          casesRes.data.data.forEach((c: any) => {
            if (!c?.id || !c?.title) return;
            options.set(c.id, { id: c.id, title: c.title, label: `Meu caso: ${c.title}` });
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
                });
              }
            });
        }

        setCaseOptions(Array.from(options.values()));
      } catch {
        setError('Erro ao carregar grupos ou casos.');
      } finally {
        setLoading(false);
        setCaseOptionsLoading(false);
      }
    };

    if (user) {
      fetchGroupsAndOptions();
    } else {
      setLoading(false);
    }
  }, [user]);

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
        setGroups((prev) => [res.data.data, ...prev]);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-dark">Grupos de Busca</h1>

      <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-dark mb-3">Criar novo grupo</h2>
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
              disabled={caseOptionsLoading || caseOptions.length === 0}
            >
              <option value="">
                {caseOptionsLoading
                  ? 'Carregando casos...'
                  : caseOptions.length === 0
                    ? 'Sem casos disponíveis'
                    : 'Selecione um caso'}
              </option>
              {caseOptions.map((c) => (
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

      <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-3">Meus grupos</h2>
        {loading ? (
          <p className="text-dark/70 text-sm">Carregando grupos...</p>
        ) : error ? (
          <p className="text-red-700 text-sm">{error}</p>
        ) : groups.length === 0 ? (
          <p className="text-dark/70 text-sm">
            Você ainda não participa de nenhum grupo de busca.
          </p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li
                key={group.id}
                className="border border-border rounded-2xl px-4 py-3 text-sm bg-card"
              >
                <div className="flex justify-between items-start gap-3 mb-1">
                  <Link to={`/groups/${group.id}`} className="font-semibold text-dark hover:underline">
                    {group.name}
                  </Link>
                  {!group.isActive && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted/20 text-dark border border-muted/30">
                      Inativo
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
                <div className="mt-2">
                  {(() => {
                    const myMember = group.members?.find((m) => m.user?.id === user.id);
                    const myRole = myMember?.role ?? (group.leaderId === user.id ? 'LEADER' : undefined);
                    const roleLabel = myRole === 'LEADER' ? 'Líder' : myRole ? 'Membro' : null;
                    return (
                      <p className="text-dark/60 text-xs">
                        Seu papel:&nbsp;
                        <span className="font-medium">{roleLabel ?? '-'}</span>
                      </p>
                    );
                  })()}
                  {group.members && group.members.length > 0 && (
                    <div className="mt-2">
                      <p className="text-dark/70 text-xs font-semibold mb-1">Membros</p>
                      <ul className="space-y-1">
                        {group.members.map((m) => (
                          <li key={`${m.user?.id ?? m.joinedAt}-${m.role}-${m.joinedAt}`}>
                            <span className="text-dark/80 text-xs">
                              {m.user?.name ?? 'Membro'}{' '}
                              <span className="text-dark/60">
                                ({m.role === 'LEADER' ? 'Líder' : 'Membro'})
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Ações apenas para líder */}
                {(() => {
                  const myMember = group.members?.find((m) => m.user?.id === user.id);
                  const isLeader = (myMember?.role ?? (group.leaderId === user.id ? 'LEADER' : undefined)) === 'LEADER';
                  if (!isLeader) return null;

                  if (editingGroupId === group.id) {
                    return (
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
                    );
                  }

                  return (
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
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
