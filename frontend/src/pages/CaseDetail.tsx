import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  HiArrowLeft,
  HiUser,
  HiMapPin,
  HiCalendar,
  HiDocumentText,
  HiShieldCheck,
  HiChatBubbleLeftRight,
  HiHeart,
} from 'react-icons/hi2';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Case, Tip } from '../types';

interface CaseWithRelations extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
    isVerified: boolean;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  FOUND: 'Encontrado',
  CLOSED: 'Encerrado',
  ARCHIVED: 'Arquivado',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  FOUND: 'bg-primary/30 text-dark border-primary/50',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
  ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [caseItem, setCaseItem] = useState<CaseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipContent, setTipContent] = useState('');
  const [tipLocation, setTipLocation] = useState('');
  const [tipAnonymous, setTipAnonymous] = useState(true);
  const [tipSubmitting, setTipSubmitting] = useState(false);
  const [volunteerStatus, setVolunteerStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [volunteerLoading, setVolunteerLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCase = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/cases/${id}`);
        if (res.data.success) {
          setCaseItem(res.data.data);
        } else {
          setError('Não foi possível carregar o caso.');
        }
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status === 404
            ? 'Caso não encontrado.'
            : 'Erro ao carregar o caso.'
          : 'Erro ao carregar o caso.';
        setError(message);
        setCaseItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchTips = async () => {
      setTipsLoading(true);
      try {
        const res = await api.get(`/tips/case/${id}`);
        if (res.data.success) {
          setTips(res.data.data);
        }
      } catch {
        // silêncio: seção de dicas continua vazia
      } finally {
        setTipsLoading(false);
      }
    };
    fetchTips();
  }, [id]);

  useEffect(() => {
    const fetchVolunteerStatus = async () => {
      if (!id || !currentUser) return;
      setVolunteerLoading(true);
      try {
        const res = await api.get(`/volunteers/case/${id}/me`);
        if (res.data.success && res.data.data) {
          setVolunteerStatus(res.data.data.status);
        } else {
          setVolunteerStatus('NONE');
        }
      } catch {
        setVolunteerStatus('NONE');
      } finally {
        setVolunteerLoading(false);
      }
    };
    fetchVolunteerStatus();
  }, [id, currentUser]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isOwner = currentUser && caseItem && caseItem.userId === currentUser.id;

  const handleSubmitTip = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !tipContent.trim()) return;
    setTipSubmitting(true);
    try {
      const payload: Partial<Tip> & { isAnonymous: boolean } = {
        content: tipContent.trim(),
        location: tipLocation.trim() || undefined,
        isAnonymous: tipAnonymous,
      };
      const res = await api.post(`/tips/case/${id}`, payload);
      if (res.data.success) {
        setTips((prev) => [res.data.data, ...prev]);
        setTipContent('');
        setTipLocation('');
        setTipAnonymous(true);
      }
    } catch {
      // manter simples: poderia exibir toast
      alert('Não foi possível enviar a dica. Tente novamente.');
    } finally {
      setTipSubmitting(false);
    }
  };

  const handleVolunteer = async () => {
    if (!id) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setVolunteerLoading(true);
    try {
      const res = await api.post('/volunteers', { caseId: id });
      if (res.data.success) {
        setVolunteerStatus(res.data.data.status);
      }
    } catch {
      alert('Não foi possível enviar sua solicitação de voluntário.');
    } finally {
      setVolunteerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark">Carregando caso...</p>
        </div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <p className="text-dark mb-6">{error ?? 'Caso não encontrado.'}</p>
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 bg-primary text-dark px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        >
          <HiArrowLeft className="w-5 h-5" />
          Voltar aos casos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Cabeçalho com navegação */}
      <div className="bg-dark text-white py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-primary/90 hover:text-primary mb-4"
          >
            <HiArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{caseItem.title}</h1>
              <p className="text-primary/90 text-sm">
                Atualizado em {formatDate(caseItem.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_STYLES[caseItem.status] ?? STATUS_STYLES.ACTIVE}`}
              >
                {STATUS_LABELS[caseItem.status] ?? caseItem.status}
              </span>
              {caseItem.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                  <HiShieldCheck className="w-4 h-4" />
                  Verificado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Descrição */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-6 border border-primary/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-3">
            <HiDocumentText className="w-5 h-5 text-primary" />
            Descrição
          </h2>
          <p className="text-dark whitespace-pre-wrap">{caseItem.description}</p>
        </section>

        {/* Dados da pessoa desaparecida */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-6 border border-primary/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-4">
            <HiUser className="w-5 h-5 text-primary" />
            Pessoa desaparecida
          </h2>
          <ul className="space-y-2">
            <li className="flex flex-wrap gap-2">
              <span className="text-dark/70">Nome:</span>
              <span className="font-medium text-dark">{caseItem.missingPersonName}</span>
            </li>
            {caseItem.age != null && (
              <li className="flex flex-wrap gap-2">
                <span className="text-dark/70">Idade:</span>
                <span className="font-medium text-dark">{caseItem.age} anos</span>
              </li>
            )}
            {caseItem.gender && (
              <li className="flex flex-wrap gap-2">
                <span className="text-dark/70">Gênero:</span>
                <span className="font-medium text-dark">{caseItem.gender}</span>
              </li>
            )}
            {caseItem.lastSeenLocation && (
              <li className="flex items-start gap-2">
                <HiMapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-dark/70 block text-sm">Último local visto</span>
                  <span className="font-medium text-dark">{caseItem.lastSeenLocation}</span>
                </div>
              </li>
            )}
            {caseItem.lastSeenDate && (
              <li className="flex items-start gap-2">
                <HiCalendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-dark/70 block text-sm">Data do desaparecimento</span>
                  <span className="font-medium text-dark">
                    {formatDate(caseItem.lastSeenDate)}
                  </span>
                </div>
              </li>
            )}
          </ul>
        </section>

        {/* Mídia (fotos) */}
        {caseItem.media && caseItem.media.length > 0 && (
          <section className="bg-white rounded-xl shadow-md p-6 mb-6 border border-primary/10">
            <h2 className="text-lg font-semibold text-dark mb-4">Fotos e anexos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {caseItem.media.map((m) => (
                <div key={m.id} className="rounded-lg overflow-hidden bg-gray-100">
                  {m.type === 'IMAGE' ? (
                    <img
                      src={m.url}
                      alt="Anexo do caso"
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-40 text-primary font-medium hover:underline"
                    >
                      Ver anexo
                    </a>
                  )}
                  {m.isVerified && (
                    <p className="p-2 text-xs text-primary flex items-center gap-1">
                      <HiShieldCheck className="w-3 h-3" />
                      Verificado
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dicas - formulário e lista */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-6 border border-primary/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-4">
            <HiChatBubbleLeftRight className="w-5 h-5 text-primary" />
            Dicas e informações
          </h2>
          <p className="text-dark/70 text-sm mb-4">
            Você pode enviar informações de forma anônima para ajudar na localização da pessoa desaparecida.
          </p>

          <form onSubmit={handleSubmitTip} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Sua dica
              </label>
              <textarea
                value={tipContent}
                onChange={(e) => setTipContent(e.target.value)}
                rows={3}
                className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                placeholder="Descreva o que você viu, horário, características, etc."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Local (opcional)
              </label>
              <input
                type="text"
                value={tipLocation}
                onChange={(e) => setTipLocation(e.target.value)}
                className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                placeholder="Ex: Praça Central, próximo ao mercado X"
              />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 text-sm text-dark/80">
                <input
                  type="checkbox"
                  checked={tipAnonymous}
                  onChange={(e) => setTipAnonymous(e.target.checked)}
                  className="rounded border-primary/40 text-primary focus:ring-primary"
                />
                Enviar como anônimo
              </label>
              <button
                type="submit"
                disabled={tipSubmitting || !tipContent.trim()}
                className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {tipSubmitting ? 'Enviando...' : 'Enviar dica'}
              </button>
            </div>
          </form>

          <div className="border-t border-primary/10 pt-4">
            <h3 className="text-sm font-semibold text-dark mb-3">
              Dicas recebidas
            </h3>
            {tipsLoading ? (
              <p className="text-dark/70 text-sm">Carregando dicas...</p>
            ) : tips.length === 0 ? (
              <p className="text-dark/70 text-sm">
                Ainda não há dicas para este caso. Qualquer informação pode fazer a diferença.
              </p>
            ) : (
              <ul className="space-y-3">
                {tips.map((tip) => (
                  <li
                    key={tip.id}
                    className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm"
                  >
                    <p className="text-dark mb-1 whitespace-pre-wrap">{tip.content}</p>
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-dark/70">
                      <span>
                        {tip.isAnonymous ? 'Anônimo' : 'Colaborador identificado'}
                        {tip.location ? ` • ${tip.location}` : ''}
                      </span>
                      <span>
                        {formatDate(tip.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Quero ajudar - CTA */}
        <section className="bg-primary/20 rounded-xl p-6 mb-8 border border-primary/30">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-2">
            <HiHeart className="w-5 h-5 text-primary" />
            Quero ajudar
          </h2>
          <p className="text-dark/80 text-sm mb-4">
            Inscreva-se como voluntário para participar de buscas, grupos de apoio e receber
            atualizações sobre este caso.
          </p>
          {!currentUser ? (
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Entrar para se inscrever
            </Link>
          ) : volunteerStatus === 'NONE' ? (
            <button
              type="button"
              onClick={handleVolunteer}
              disabled={volunteerLoading}
              className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {volunteerLoading ? 'Enviando...' : 'Quero ajudar neste caso'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-sm text-dark border border-primary/40">
              Status como voluntário:
              <strong>
                {volunteerStatus === 'PENDING' && 'Aguardando aprovação'}
                {volunteerStatus === 'APPROVED' && 'Aprovado'}
                {volunteerStatus === 'REJECTED' && 'Rejeitado'}
              </strong>
            </span>
          )}
        </section>

        {/* Responsável e ações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-primary/20">
          <div className="text-sm text-dark/70">
            {caseItem.user ? (
              <>
                Caso criado por <span className="font-medium text-dark">{caseItem.user.name}</span> em{' '}
                {formatDate(caseItem.createdAt)}.
              </>
            ) : (
              <>Criado em {formatDate(caseItem.createdAt)}.</>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <HiArrowLeft className="w-4 h-4" />
              Ver todos os casos
            </Link>
            {isOwner && (
              <Link
                to="/my-cases"
                className="inline-flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-medium hover:opacity-90"
              >
                Meus casos
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
