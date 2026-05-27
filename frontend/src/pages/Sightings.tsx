import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { HiCamera, HiMapPin } from 'react-icons/hi2';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured, uploadSightingPhoto } from '../lib/supabase';
import type { Case, Sighting } from '../types';

const DEFAULT_CENTER: [number, number] = [-19.9167, -43.9345];

function MapClickSelect({
  position,
  onPick,
}: {
  position: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        color: '#4B2C32',
        fillColor: '#84F598',
        fillOpacity: 0.95,
        weight: 2,
      }}
    />
  ) : null;
}

export default function Sightings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [caseId, setCaseId] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [list, setList] = useState<Sighting[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Faça login para registrar avistamentos');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/cases');
        if (res.data.success) {
          const active = (res.data.data as Case[]).filter((c) => c.status === 'ACTIVE');
          setCases(active);
        }
      } catch {
        toast.error('Erro ao carregar casos');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        const res = await api.get('/sightings');
        if (res.data.success) {
          setList(res.data.data);
        }
      } catch {
        // lista vazia
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  const onPick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!caseId) {
      toast.error('Selecione um caso');
      return;
    }
    if (!position) {
      toast.error('Clique no mapa para marcar o local do avistamento');
      return;
    }
    if (!file) {
      toast.error('Envie uma foto do avistamento');
      return;
    }
    if (!isSupabaseConfigured()) {
      toast.error(
        'Configure o Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) para envio de fotos.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const photoUrl = await uploadSightingPhoto(file);
      const v = await api.post('/media/validate', { imageUrl: photoUrl });
      if (!v.data?.success) {
        toast.error(v.data?.message || 'Foto não passou na validação automática.');
        setSubmitting(false);
        return;
      }
      const res = await api.post('/sightings', {
        caseId,
        description: description.trim() || undefined,
        latitude: position[0],
        longitude: position[1],
        photoUrl,
      });
      if (res.data.success) {
        toast.success('Avistamento registrado!');
        setDescription('');
        setFile(null);
        setPosition(null);
        setCaseId('');
        const r = await api.get('/sightings');
        if (r.data.success) setList(r.data.data);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Não foi possível salvar';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const mapCenter = position ?? DEFAULT_CENTER;

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
          Comunidade
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-dark tracking-tight flex items-center gap-3">
          <HiCamera className="w-9 h-9 text-primary shrink-0" />
          Avistamentos
        </h1>
        <p className="text-dark/75 mt-3 max-w-2xl">
          Registre um possível avistamento com foto e localização no mapa. As fotos são armazenadas
          no Supabase Storage e aparecem no mapa geral junto com casos e dicas.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
            <HiMapPin className="w-5 h-5 text-primary" />
            Novo avistamento
          </h2>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Caso relacionado *</label>
            <select
              required
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-dark"
            >
              <option value="">Selecione um caso ativo</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.missingPersonName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-dark"
              placeholder="Ex: visto na saída do mercado, roupa azul..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Foto *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-dark file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-dark file:font-medium"
            />
            {!isSupabaseConfigured() && (
              <p className="text-xs text-accent mt-1">
                Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e crie o bucket público{' '}
                <code className="bg-dark/5 px-1 rounded">sightings</code> no Supabase.
              </p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-dark mb-2">
              Local no mapa * (clique para marcar)
            </p>
            <div className="h-64 overflow-hidden rounded-xl border border-border">
              <MapContainer
                center={mapCenter}
                zoom={position ? 15 : 12}
                className="h-full w-full z-0"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickSelect position={position} onPick={onPick} />
              </MapContainer>
            </div>
            {position && (
              <p className="text-xs text-dark/70 mt-1 font-mono">
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-dark font-semibold hover:opacity-95 disabled:opacity-50 ring-1 ring-primary/30"
          >
            {submitting ? 'Enviando...' : 'Registrar avistamento'}
          </button>
        </form>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Últimos avistamentos</h2>
          {loadingList ? (
            <p className="text-dark/70 text-sm">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="text-dark/70 text-sm">Nenhum avistamento ainda.</p>
          ) : (
            <ul className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="flex gap-3 p-3">
                    <img
                      src={s.photoUrl}
                      alt=""
                      className="w-24 h-24 object-cover rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/cases/${s.caseId}`}
                        className="font-medium text-primary hover:underline text-sm line-clamp-2"
                      >
                        {s.case?.title ?? 'Caso'}
                      </Link>
                      {s.description && (
                        <p className="text-sm text-dark/80 mt-1 line-clamp-2">{s.description}</p>
                      )}
                      <p className="text-xs text-dark/60 mt-1">
                        {format(new Date(s.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/map"
            className="inline-block mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Ver no mapa →
          </Link>
        </div>
      </div>
    </div>
  );
}
