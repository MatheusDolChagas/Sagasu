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
  HiShare,
} from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured, uploadCasePhoto } from '../lib/supabase';
import type { Case, Tip, Sighting } from '../types';
import ShareBar from '../components/ShareBar';
import CaseFeed from '../components/CaseFeed';
import AddressSuggestField from '../components/AddressSuggestField';
import ConfirmDialog from '../components/ConfirmDialog';

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
  FOUND: 'Pessoa encontrada',
  CLOSED: 'Caso cancelado',
  ARCHIVED: 'Arquivado',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    'border border-emerald-500/45 bg-emerald-500/15 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300',
  FOUND:
    'border border-sky-500/45 bg-sky-500/15 text-sky-900 dark:bg-sky-500/20 dark:text-sky-300',
  CLOSED:
    'border border-amber-500/45 bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300',
  ARCHIVED: 'border border-border bg-muted-bg/50 text-dark',
};

/** Badges no hero escuro — fundo sólido e contraste alto */
const STATUS_STYLES_ON_DARK: Record<string, string> = {
  ACTIVE:
    'border border-emerald-200 bg-emerald-400 text-emerald-950 shadow-md ring-1 ring-emerald-300/50',
  FOUND:
    'border border-sky-200 bg-sky-400 text-sky-950 shadow-md ring-1 ring-sky-300/50',
  CLOSED:
    'border border-amber-200 bg-amber-400 text-amber-950 shadow-md ring-1 ring-amber-300/50',
  ARCHIVED:
    'border border-zinc-200 bg-zinc-300 text-zinc-900 shadow-md ring-1 ring-zinc-400/50',
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
  const [tipCoords, setTipCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [tipAnonymous, setTipAnonymous] = useState(true);
  const [tipSubmitting, setTipSubmitting] = useState(false);
  const [volunteerStatus, setVolunteerStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [caseVolunteers, setCaseVolunteers] = useState<any[]>([]);
  const [caseVolunteersLoading, setCaseVolunteersLoading] = useState(false);
  const [sightingsByCase, setSightingsByCase] = useState<Sighting[]>([]);
  const [attachmentsBusy, setAttachmentsBusy] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [promotingSightingId, setPromotingSightingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [closeOutcome, setCloseOutcome] = useState<'FOUND' | 'CANCELLED'>('FOUND');
  const [closureDetails, setClosureDetails] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  useEffect(() => {
    setShareUrl(typeof window !== 'undefined' ? window.location.href : '');
  }, [id]);

  useEffect(() => {
    if (!currentUser) {
      setTipAnonymous(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!id) return;
    const fetchCase = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/cases/${id}`);
        if (res.data.success) {
          const c = res.data.data as CaseWithRelations;
          setCaseItem(c);
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
  const isCaseActive = caseItem?.status === 'ACTIVE';

  const canExport =
    currentUser &&
    caseItem &&
    (isOwner || ['POLICE', 'ADMIN', 'NGO'].includes(currentUser.role));

  const downloadExport = async (format: 'json' | 'txt') => {
    if (!id) return;
    try {
      const res = await api.get(`/cases/${id}/export-authorities`, {
        params: { format },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sagasu-caso-${id.slice(0, 8)}-autoridades.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível gerar o arquivo. Verifique se você tem permissão.');
    }
  };

  const mailtoAuthorities = () => {
    if (!caseItem) return;
    const subject = encodeURIComponent(`Sagasu — Encaminhamento: ${caseItem.title}`);
    const body = encodeURIComponent(
      [
        'Solicito análise deste caso cadastrado na plataforma Sagasu.',
        '',
        `Caso: ${caseItem.title}`,
        `Pessoa: ${caseItem.missingPersonName}`,
        `Link: ${window.location.href}`,
        '',
        'Anexo: utilize a opção "Exportar JSON" ou "Exportar texto" na página do caso para obter o dossiê completo.',
      ].join('\n'),
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    const fetchCaseVolunteers = async () => {
      if (!id || !currentUser || !isOwner) return;
      setCaseVolunteersLoading(true);
      try {
        const res = await api.get(`/volunteers/case/${id}`);
        if (res.data.success) {
          setCaseVolunteers(res.data.data);
        }
      } catch {
        setCaseVolunteers([]);
      } finally {
        setCaseVolunteersLoading(false);
      }
    };
    fetchCaseVolunteers();
  }, [id, currentUser, isOwner]);

  useEffect(() => {
    const fetchSightingsByCase = async () => {
      if (!id || !isOwner) return;
      try {
        const res = await api.get(`/sightings/case/${id}`);
        if (res.data.success) {
          setSightingsByCase(res.data.data as Sighting[]);
        }
      } catch {
        setSightingsByCase([]);
      }
    };
    fetchSightingsByCase();
  }, [id, isOwner]);

  const handleSubmitTip = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !tipContent.trim() || !isCaseActive) return;
    setTipSubmitting(true);
    try {
      const payload: Partial<Tip> & { isAnonymous: boolean } = {
        content: tipContent.trim(),
        location: tipLocation.trim() || undefined,
        isAnonymous: currentUser ? tipAnonymous : true,
      };
      if (tipCoords) {
        payload.latitude = tipCoords.latitude;
        payload.longitude = tipCoords.longitude;
      }
      const res = await api.post(`/tips/case/${id}`, payload);
      if (res.data.success) {
        setTips((prev) => [res.data.data, ...prev]);
        setTipContent('');
        setTipLocation('');
        setTipCoords(null);
        setTipAnonymous(true);
      }
    } catch {
      // manter simples: poderia exibir toast
      alert('Não foi possível enviar a dica. Tente novamente.');
    } finally {
      setTipSubmitting(false);
    }
  };

  const buildClosePayload = () => {
    if (closeOutcome === 'FOUND') {
      return { outcome: 'FOUND' as const, closureDetails: closureDetails.trim() };
    }
    return { outcome: 'CANCELLED' as const, cancellationReason: cancellationReason.trim() };
  };

  const validateCloseForm = (): boolean => {
    if (closeOutcome === 'FOUND') {
      if (closureDetails.trim().length < 10) {
        toast.error('Descreva como a pessoa foi encontrada (mínimo 10 caracteres).');
        return false;
      }
      return true;
    }
    if (cancellationReason.trim().length < 10) {
      toast.error('Informe o motivo do cancelamento (mínimo 10 caracteres).');
      return false;
    }
    return true;
  };

  const handleCloseFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateCloseForm()) return;
    setCloseConfirmOpen(true);
  };

  const executeCloseCase = async () => {
    if (!id || !isOwner || !validateCloseForm()) return;

    setCloseSubmitting(true);
    try {
      const res = await api.post(`/cases/${id}/close`, buildClosePayload());
      if (res.data.success) {
        setCaseItem(res.data.data as CaseWithRelations);
        setClosureDetails('');
        setCancellationReason('');
        setCloseConfirmOpen(false);
        toast.success(res.data.message || 'Caso finalizado com sucesso.');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Não foi possível finalizar o caso.';
      toast.error(msg || 'Não foi possível finalizar o caso.');
    } finally {
      setCloseSubmitting(false);
    }
  };

  const handleVolunteer = async () => {
    if (!id) return;
    if (!isCaseActive) return;
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

  const handleUpdateVolunteerStatus = async (volunteerId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.put(`/volunteers/${volunteerId}/status`, { status });
      if (res.data.success) {
        setCaseVolunteers((prev) =>
          prev.map((v) => (v.id === volunteerId ? { ...v, status: res.data.data.status } : v)),
        );
      }
    } catch {
      alert('Não foi possível atualizar o status do voluntário.');
    }
  };

  const handleAttachMedia = async () => {
    if (!id || !attachmentFile) return;
    if (!isSupabaseConfigured()) {
      toast.error('Envio de imagem indisponível no momento.');
      return;
    }
    setAttachmentsBusy(true);
    try {
      const imageUrl = await uploadCasePhoto(attachmentFile);
      const v = await api.post('/media/validate', { imageUrl, context: 'general' });
      if (!v.data?.success) {
        toast.error(v.data?.message || 'Imagem não passou na validação.');
        return;
      }

      const res = await api.post(`/media/case/${id}/attachments`, { imageUrl });
      if (res.data.success) {
        setCaseItem((prev) =>
          prev
            ? { ...prev, media: [...(prev.media ?? []), res.data.data] }
            : prev,
        );
        setAttachmentFile(null);
        toast.success('Foto anexada ao caso.');
      }
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Não foi possível anexar imagem.');
    } finally {
      setAttachmentsBusy(false);
    }
  };

  const handlePromoteSighting = async (sightingId: string) => {
    if (!id) return;
    setPromotingSightingId(sightingId);
    try {
      const res = await api.post(`/media/case/${id}/from-sighting`, { sightingId });
      if (res.data.success && res.data.data?.url) {
        const exists = (caseItem?.media ?? []).some((m) => m.url === res.data.data.url);
        if (!exists) {
          setCaseItem((prev) =>
            prev
              ? { ...prev, media: [...(prev.media ?? []), res.data.data] }
              : prev,
          );
        }
        toast.success('Foto do avistamento adicionada em Fotos e anexos.');
      }
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Não foi possível promover o avistamento.');
    } finally {
      setPromotingSightingId(null);
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
      <div className="bg-zinc-900 px-4 py-6 text-white dark:bg-zinc-950">
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
              <p className="text-white/85 text-base">
                Atualizado em {formatDate(caseItem.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-base font-semibold border ${
                  STATUS_STYLES_ON_DARK[caseItem.status] ?? STATUS_STYLES_ON_DARK.ACTIVE
                }`}
              >
                {STATUS_LABELS[caseItem.status] ?? caseItem.status}
              </span>
              {caseItem.isVerified && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/30 bg-white text-zinc-900 text-base font-semibold shadow-md">
                  <HiShieldCheck className="w-5 h-5 text-emerald-700" aria-hidden />
                  Verificado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-6 relative z-10 mb-4">
        {caseItem && shareUrl ? (
          <ShareBar
            title={caseItem.title}
            description={caseItem.description}
            url={shareUrl}
            missingPersonName={caseItem.missingPersonName}
            imageUrl={
              caseItem.media?.find((m) => m.type === 'IMAGE')?.url
            }
          />
        ) : null}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Descrição */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-3">
            <HiDocumentText className="w-5 h-5 text-primary" />
            Descrição
          </h2>
          <p className="text-dark whitespace-pre-wrap">{caseItem.description}</p>
        </section>

        {!isCaseActive && (
          <section className="bg-card rounded-2xl border border-amber-500/35 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-dark mb-2">Encerramento do caso</h2>
            {caseItem.status === 'FOUND' && caseItem.closureDetails && (
              <div className="text-sm text-dark/90 space-y-2">
                <p className="font-medium text-sky-800 dark:text-sky-200">
                  Pessoa encontrada
                </p>
                <p className="whitespace-pre-wrap">{caseItem.closureDetails}</p>
              </div>
            )}
            {caseItem.status === 'CLOSED' && caseItem.cancellationReason && (
              <div className="text-sm text-dark/90 space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Caso cancelado
                </p>
                <p className="whitespace-pre-wrap">{caseItem.cancellationReason}</p>
              </div>
            )}
            {caseItem.closedAt && (
              <p className="text-xs text-dark/60 mt-3">
                Finalizado em {formatDate(caseItem.closedAt)}
              </p>
            )}
            <p className="text-xs text-dark/65 mt-3">
              Os contatos salvos com voluntários permanecem disponíveis na página de grupos.
            </p>
          </section>
        )}

        {isOwner && isCaseActive && (
          <section className="bg-card rounded-2xl border border-amber-500/40 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-dark mb-2">Finalizar caso</h2>
            <p className="text-sm text-dark/75 mb-4">
              Registre como este caso foi encerrado. Grupos de busca deixam de aceitar novas entradas;
              contatos salvos com voluntários continuam acessíveis.
            </p>
            <form onSubmit={handleCloseFormSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-dark cursor-pointer">
                  <input
                    type="radio"
                    name="closeOutcome"
                    checked={closeOutcome === 'FOUND'}
                    onChange={() => setCloseOutcome('FOUND')}
                    className="text-primary focus:ring-primary"
                  />
                  Pessoa encontrada
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-dark cursor-pointer">
                  <input
                    type="radio"
                    name="closeOutcome"
                    checked={closeOutcome === 'CANCELLED'}
                    onChange={() => setCloseOutcome('CANCELLED')}
                    className="text-primary focus:ring-primary"
                  />
                  Caso cancelado
                </label>
              </div>
              {closeOutcome === 'FOUND' ? (
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Como a pessoa foi encontrada? *
                  </label>
                  <textarea
                    value={closureDetails}
                    onChange={(e) => setClosureDetails(e.target.value)}
                    rows={4}
                    required
                    minLength={10}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex.: Encontrada em casa de familiar, às 14h, com saúde estável..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Motivo do cancelamento *
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={4}
                    required
                    minLength={10}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex.: Informação incorreta, pessoa já havia retornado, duplicidade de caso..."
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={closeSubmitting}
                className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 dark:bg-amber-600"
              >
                Encerrar caso
              </button>
            </form>
          </section>
        )}

        <ConfirmDialog
          open={closeConfirmOpen}
          title={
            closeOutcome === 'FOUND'
              ? 'Confirmar pessoa encontrada?'
              : 'Confirmar cancelamento do caso?'
          }
          description={
            closeOutcome === 'FOUND' ? (
              <>
                <p className="mb-2">
                  O caso será marcado como <strong>pessoa encontrada</strong> e deixará de aceitar
                  novas dicas, voluntários e entradas em grupos de busca.
                </p>
                <p className="text-dark/70 text-xs rounded-lg bg-muted-bg/50 border border-border p-2 whitespace-pre-wrap">
                  {closureDetails.trim()}
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  O caso será <strong>cancelado</strong>. Esta ação não pode ser desfeita pela
                  interface. Contatos salvos com voluntários permanecem acessíveis.
                </p>
                <p className="text-dark/70 text-xs rounded-lg bg-muted-bg/50 border border-border p-2 whitespace-pre-wrap">
                  {cancellationReason.trim()}
                </p>
              </>
            )
          }
          confirmLabel={
            closeOutcome === 'FOUND' ? 'Sim, pessoa encontrada' : 'Sim, cancelar caso'
          }
          variant={closeOutcome === 'CANCELLED' ? 'danger' : 'default'}
          loading={closeSubmitting}
          onConfirm={() => void executeCloseCase()}
          onCancel={() => !closeSubmitting && setCloseConfirmOpen(false)}
        />

        {id && <CaseFeed caseId={id} isOwner={!!isOwner} />}

        {/* Dados da pessoa desaparecida */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
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

        {canExport && (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-2">
              <HiShare className="w-5 h-5 text-forest" />
              Compartilhar com autoridades
            </h2>
            <p className="text-dark/70 text-sm mb-4">
              Gere um dossiê com dados do caso, dicas, voluntários, avistamentos e links de mídia
              para encaminhar a órgãos de segurança ou defensoria.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadExport('txt')}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Exportar texto
              </button>
              <button
                type="button"
                onClick={mailtoAuthorities}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark hover:bg-muted-bg/80"
              >
                Encaminhar por e-mail
              </button>
            </div>
          </section>
        )}

        {/* Mídia (fotos) */}
        {caseItem.media && caseItem.media.length > 0 && (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
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

        {isOwner && (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-dark mb-2">Adicionar fotos e anexos</h2>
            <p className="text-sm text-dark/75 mb-4">
              Além da foto principal da pessoa, você pode anexar imagens de roupas, objetos ou
              outros itens relevantes para ajudar nas buscas.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                className="text-sm text-dark file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-primary-fg"
              />
              <button
                type="button"
                disabled={attachmentsBusy || !attachmentFile}
                onClick={() => void handleAttachMedia()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {attachmentsBusy ? 'Anexando...' : 'Anexar imagem'}
              </button>
            </div>

            {sightingsByCase.length > 0 ? (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-dark mb-3">
                  Usar fotos de avistamentos em “Fotos e anexos”
                </h3>
                <ul className="space-y-3">
                  {sightingsByCase.slice(0, 8).map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted-bg/35 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={s.photoUrl}
                          alt=""
                          className="h-14 w-14 rounded-md border border-border object-cover"
                        />
                        <div>
                          <p className="text-xs text-dark/70">
                            {formatDate(s.createdAt)}
                          </p>
                          {s.description ? (
                            <p className="line-clamp-1 text-sm text-dark">{s.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={promotingSightingId === s.id}
                        onClick={() => void handlePromoteSighting(s.id)}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-dark hover:bg-muted-bg/80 disabled:opacity-60"
                      >
                        {promotingSightingId === s.id
                          ? 'Adicionando...'
                          : 'Adicionar em Fotos e anexos'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {/* Dicas - formulário e lista */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-4">
            <HiChatBubbleLeftRight className="w-5 h-5 text-primary" />
            Dicas e informações
          </h2>
          <p className="text-dark/70 text-sm mb-4">
            Você pode enviar informações de forma anônima para ajudar na localização da pessoa desaparecida.
          </p>

          {!isCaseActive && (
            <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
              Este caso foi finalizado. Novas dicas não podem ser enviadas.
            </p>
          )}

          <form onSubmit={handleSubmitTip} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Sua dica
              </label>
              <textarea
                value={tipContent}
                onChange={(e) => setTipContent(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Descreva o que você viu, horário, características, etc."
                required
                disabled={!isCaseActive}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Local (opcional)
              </label>
              <AddressSuggestField
                value={tipLocation}
                onChange={(v) => {
                  setTipLocation(v);
                  setTipCoords(null);
                }}
                onSelect={(s) => {
                  setTipLocation(s.label);
                  setTipCoords({ latitude: s.latitude, longitude: s.longitude });
                }}
                placeholder="Digite o endereço (ex.: Praça da Liberdade, Belo Horizonte)"
              />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {currentUser ? (
                <label className="inline-flex items-center gap-2 text-sm text-dark/80">
                  <input
                    type="checkbox"
                    checked={tipAnonymous}
                    onChange={(e) => setTipAnonymous(e.target.checked)}
                    className="rounded border-primary/40 text-primary focus:ring-primary"
                  />
                  Enviar como anônimo
                </label>
              ) : (
                <p className="text-sm text-dark/75">
                  Sem login, sua dica será enviada <strong>sempre de forma anônima</strong>.
                </p>
              )}
              <button
                type="submit"
                disabled={!isCaseActive || tipSubmitting || !tipContent.trim()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
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
                        {tip.isAnonymous || !tip.user
                          ? 'Anônimo'
                          : isOwner
                            ? `Por ${tip.user.name}`
                            : 'Colaborador identificado'}
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

        {/* Quero ajudar / Voluntários */}
        <section className="bg-muted-bg/60 rounded-2xl border border-border p-6 mb-8 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-dark mb-2">
            <HiHeart className="w-5 h-5 text-primary" />
            {isOwner ? 'Voluntários deste caso' : 'Quero ajudar'}
          </h2>
          {isOwner ? (
            <>
              <p className="text-dark/80 text-sm mb-4">
                Aqui você vê quem se inscreveu como voluntário para este caso e pode aprovar ou
                rejeitar as solicitações.
              </p>
              {caseVolunteersLoading ? (
                <p className="text-dark/70 text-sm">Carregando voluntários...</p>
              ) : caseVolunteers.length === 0 ? (
                <p className="text-dark/70 text-sm">
                  Ainda não há voluntários cadastrados para este caso.
                </p>
              ) : (
                <ul className="space-y-2">
                  {caseVolunteers.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-dark">
                          {v.user?.name ?? 'Voluntário'}
                        </p>
                        <p className="text-xs text-dark/70">
                          Status:{' '}
                          <strong>
                            {v.status === 'PENDING' && 'Aguardando aprovação'}
                            {v.status === 'APPROVED' && 'Aprovado'}
                            {v.status === 'REJECTED' && 'Rejeitado'}
                          </strong>
                        </p>
                      </div>
                      {v.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateVolunteerStatus(v.id, 'APPROVED')}
                            className="px-3 py-1 text-xs rounded bg-dark text-white hover:opacity-90"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateVolunteerStatus(v.id, 'REJECTED')}
                            className="rounded border border-border bg-card px-3 py-1 text-xs text-dark hover:bg-muted-bg/80"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="text-dark/80 text-sm mb-4">
                Inscreva-se como voluntário para participar de buscas, grupos de apoio e receber
                atualizações sobre este caso.
              </p>
              {!isCaseActive ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Este caso não está mais aceitando novos voluntários.
                </p>
              ) : !currentUser ? (
                <Link
                  to="/login"
                  className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Entrar para se inscrever
                </Link>
              ) : volunteerStatus === 'NONE' ? (
                <button
                  type="button"
                  onClick={handleVolunteer}
                  disabled={volunteerLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {volunteerLoading ? 'Enviando...' : 'Quero ajudar neste caso'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark">
                  Status como voluntário:
                  <strong>
                    {volunteerStatus === 'PENDING' && 'Aguardando aprovação'}
                    {volunteerStatus === 'APPROVED' && 'Aprovado'}
                    {volunteerStatus === 'REJECTED' && 'Rejeitado'}
                  </strong>
                </span>
              )}
            </>
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
