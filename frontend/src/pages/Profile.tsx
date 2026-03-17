import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Case, Group } from '../types';
import CaseCard from '../components/CaseCard';
import { format } from 'date-fns';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.put('/auth/profile', formData);
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
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-dark">Dados Pessoais</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
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
                className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
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
                className="px-6 py-2 border border-dark rounded-lg hover:bg-background"
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
            <div>
              <p className="text-sm font-medium text-dark opacity-75">Tipo de Conta</p>
              <p className="text-lg text-dark">{user.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Seção de Casos */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-dark">Meus Casos</h2>
          <button
            onClick={() => navigate('/cases/create')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Criar Novo Caso
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
              onClick={() => navigate('/cases/create')}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90"
            >
              Criar Primeiro Caso
            </button>
          </div>
        )}
      </div>

      {/* Seção de Grupos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-dark mb-6">Grupos que Participo</h2>

        {isLoadingData ? (
          <p className="text-dark">Carregando grupos...</p>
        ) : groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="border border-dark/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-dark mb-2">{group.name}</h3>
                    {group.description && (
                      <p className="text-dark mb-3">{group.description}</p>
                    )}
                    {group.case && (
                      <p className="text-sm text-dark opacity-75 mb-1">
                        <strong>Caso:</strong> {group.case.title}
                      </p>
                    )}
                    {group.leader && (
                      <p className="text-sm text-dark opacity-75 mb-1">
                        <strong>Líder:</strong> {group.leader.name}
                      </p>
                    )}
                    <p className="text-xs text-dark opacity-60">
                      Entrou em: {format(new Date(group.createdAt), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    group.isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-dark/10 text-dark'
                  }`}>
                    {group.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-dark">Você ainda não participa de nenhum grupo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
