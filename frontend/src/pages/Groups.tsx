import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Group } from '../types';

interface MyGroup extends Group {
  members?: Array<{
    role: string;
    joinedAt: string;
  }>;
}

export default function Groups() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [caseId, setCaseId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/groups/my');
        if (res.data.success) {
          setGroups(res.data.data);
        } else {
          setError('Não foi possível carregar seus grupos.');
        }
      } catch {
        setError('Erro ao carregar grupos.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGroups();
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
      alert('Não foi possível criar o grupo. Verifique o ID do caso e tente novamente.');
    } finally {
      setSubmitting(false);
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
          className="inline-flex items-center gap-2 bg-dark text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-dark">Grupos de Busca</h1>

      <section className="bg-white rounded-xl shadow-md p-6 mb-8 border border-primary/10">
        <h2 className="text-xl font-semibold text-dark mb-3">Criar novo grupo</h2>
        <p className="text-sm text-dark/80 mb-4">
          Use o ID de um caso para criar um grupo de busca específico para ele.
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
              className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              placeholder="Ex: Grupo de busca - Bairro Centro"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              ID do caso
            </label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              placeholder="Cole aqui o ID do caso"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              placeholder="Explique o objetivo do grupo, ponto de encontro, horários, etc."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Criando...' : 'Criar grupo'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl shadow-md p-6 border border-primary/10">
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
                className="border border-primary/20 rounded-lg px-4 py-3 text-sm bg-primary/5"
              >
                <div className="flex justify-between items-start gap-3 mb-1">
                  <h3 className="font-semibold text-dark">{group.name}</h3>
                  {!group.isActive && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
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
                {group.members && group.members[0] && (
                  <p className="text-dark/60 text-xs mt-1">
                    Seu papel:&nbsp;
                    <span className="font-medium">
                      {group.members[0].role === 'LEADER' ? 'Líder' : 'Membro'}
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
