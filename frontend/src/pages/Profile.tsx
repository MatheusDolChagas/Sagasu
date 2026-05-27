import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import axios from 'axios';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
import { toast } from 'react-hot-toast';
import { Case, Group } from '../types';
import CaseCard from '../components/CaseCard';
import { format } from 'date-fns';
import { HiUserGroup, HiChevronRight } from 'react-icons/hi2';
import { isSupabaseConfigured, uploadProfileAvatar } from '../lib/supabase';
import { isValidEmail, normalizeEmail } from '../lib/validateEmail';

interface CaseWithUser extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface GroupWithDetails extends Group {
  case?: {
    id: string;
    title: string;
  };
  leader?: {
    id: string;
    name: string;
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, login, token } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para acessar o perfil');
      navigate('/login');
      return;
    }

    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
    });

    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    setIsLoadingData(true);
    try {
      // Buscar casos do usuário
      const casesResponse = await api.get('/cases/my/list');
      if (casesResponse.data.success) {
        const mappedCases: Case[] = casesResponse.data.data.map((caseItem: CaseWithUser) => ({
          id: caseItem.id,
          title: caseItem.title,
          description: caseItem.description,
          missingPersonName: caseItem.missingPersonName,
          age: caseItem.age,
          gender: caseItem.gender,
          lastSeenLocation: caseItem.lastSeenLocation,
          lastSeenDate: caseItem.lastSeenDate,
          status: caseItem.status,
          isVerified: caseItem.isVerified,
          createdAt: caseItem.createdAt,
          updatedAt: caseItem.updatedAt,
          userId: caseItem.userId,
        }));
        setCases(mappedCases);
      }

      // Buscar grupos do usuário
      const groupsResponse = await api.get('/groups/my');
      if (groupsResponse.data.success) {
        setGroups(groupsResponse.data.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user || !token) return;
    if (!isSupabaseConfigured()) {
      toast.error('Configure o Supabase para enviar foto de perfil.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Imagem até 3 MB');
      return;
    }
    setAvatarBusy(true);
    try {
      const avatarUrl = await uploadProfileAvatar(user.id, file);
      const v = await api.post('/media/validate', {
        imageUrl: avatarUrl,
        context: 'avatar',
      });
      if (!v.data?.success) {
        toast.error(v.data?.message || 'Foto não passou na validação automática.');
        return;
      }
      const response = await api.put('/auth/profile', { avatarUrl });
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.data.user };
        login(updatedUser, token);
        toast.success('Foto de perfil atualizada');
      }
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Não foi possível atualizar a foto de perfil.'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(formData.email)) {
      toast.error('Email inválido');
      return;
    }
    setIsLoading(true);

    try {
      const response = await api.put('/auth/profile', {
        ...formData,
        email: normalizeEmail(formData.email),
      });
      if (response.data.success) {
        // Atualizar store com novos dados
        const updatedUser = {
          ...user!,
          ...response.data.data.user,
        };
        if (token) {
          login(updatedUser, token);
        }
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-dark">Meu Perfil</h1>

      {/* Seção de Dados do Usuário */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center sm:items-start">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-border bg-muted-bg shadow-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-muted">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => avatarInputRef.current?.click()}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-95 disabled:opacity-50"
            >
              {avatarBusy ? 'Enviando…' : 'Alterar foto'}
            </button>
            <p className="mt-1 max-w-[230px] text-center text-[11px] text-muted sm:text-left">
              Use uma foto nítida do seu rosto para facilitar identificação no perfil.
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-dark">Dados pessoais</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-90"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-dark mb-1">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                  });
                }}
                className="rounded-lg border border-border px-6 py-2 font-medium text-dark hover:bg-muted-bg/80"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-dark opacity-75">Nome Completo</p>
              <p className="text-lg text-dark">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-dark opacity-75">Email</p>
              <p className="text-lg text-dark">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <p className="text-sm font-medium text-dark opacity-75">Telefone</p>
                <p className="text-lg text-dark">{user.phone}</p>
              </div>
            )}
            {user.role === 'ADMIN' ? (
              <div>
                <p className="text-sm font-medium text-dark opacity-75">Perfil</p>
                <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-dark ring-1 ring-primary/35">
                  Administrador
                </span>
              </div>
            ) : null}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Seção de Casos */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-dark">Meus casos</h2>
          <button
            type="button"
            onClick={() => navigate('/cases/create')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-90"
          >
            Criar novo caso
          </button>
        </div>

        {isLoadingData ? (
          <p className="text-dark">Carregando casos...</p>
        ) : cases.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-dark mb-4">Você ainda não criou nenhum caso.</p>
            <button
              type="button"
              onClick={() => navigate('/cases/create')}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-90"
            >
              Criar primeiro caso
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-semibold text-dark">Grupos que participo</h2>

        {isLoadingData ? (
          <p className="text-dark">Carregando grupos...</p>
        ) : groups.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => {
              const myMembership = group.members?.find((m) => m.user?.id === user.id);
              const joinedAt = myMembership?.joinedAt ?? group.createdAt;
              return (
                <li key={group.id}>
                  <Link
                    to={`/groups/${group.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-gradient-to-br from-card to-muted-bg/30 p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-primary">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
                          <HiUserGroup className="h-5 w-5" aria-hidden />
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            group.isActive
                              ? 'bg-accent/25 text-accent-fg ring-1 ring-accent/30'
                              : 'bg-muted-bg text-muted'
                          }`}
                        >
                          {group.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <HiChevronRight
                        className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-dark group-hover:text-primary">
                      {group.name}
                    </h3>
                    {group.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{group.description}</p>
                    ) : null}
                    {group.case ? (
                      <p className="mt-3 text-xs text-dark">
                        <span className="font-semibold">Caso:</span> {group.case.title}
                      </p>
                    ) : null}
                    {group.leader ? (
                      <p className="mt-1 text-xs text-muted">
                        <span className="font-medium text-dark">Líder:</span> {group.leader.name}
                      </p>
                    ) : null}
                    <p className="mt-auto pt-3 text-[11px] text-muted">
                      Desde {format(new Date(joinedAt), 'dd/MM/yyyy')}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-8 text-center">
            <p className="text-dark">Você ainda não participa de nenhum grupo.</p>
            <Link
              to="/groups"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Explorar grupos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
