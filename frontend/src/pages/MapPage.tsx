import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { HiMap, HiMagnifyingGlass } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeatmapCell {
  latitude: number;
  longitude: number;
  count: number;
  caseCount: number;
  tipCount: number;
  sightingCount: number;
  intensity: number;
}

interface GeocodeSuggestion {
  latitude: number;
  longitude: number;
  label: string;
  type: string | null;
  category: string | null;
}

interface MapMarkerResponse {
  cases: Array<{
    type: 'case';
    id: string;
    title: string;
    missingPersonName: string;
    lastSeenLocation?: string | null;
    latitude: number;
    longitude: number;
  }>;
  tips: Array<{
    type: 'tip';
    id: string;
    content: string;
    location?: string | null;
    latitude: number;
    longitude: number;
    caseId: string;
    caseTitle: string;
    caseMissingPersonName: string;
  }>;
  sightings: Array<{
    type: 'sighting';
    id: string;
    description?: string | null;
    latitude: number;
    longitude: number;
    photoUrl: string;
    createdAt: string;
    caseId: string;
    caseTitle: string;
    caseMissingPersonName: string;
  }>;
}

const BRAZIL_CENTER: L.LatLngExpression = [-14.235, -51.9253];

function heatFill(intensity: number): string {
  const r = Math.min(255, Math.round(70 + 185 * intensity));
  const g = Math.round(210 * (1 - intensity * 0.9));
  const b = Math.round(55 * (1 - intensity * 0.7));
  return `rgb(${r},${g},${b})`;
}

function FitBounds({ points }: { points: L.LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [48, 48], maxZoom: 14 });
  }, [map, points]);
  return null;
}

function FlyToAddress({
  latitude,
  longitude,
  nonce,
}: {
  latitude: number;
  longitude: number;
  nonce: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], 15);
  }, [map, latitude, longitude, nonce]);
  return null;
}

export default function MapPage() {
  const [mapView, setMapView] = useState<'markers' | 'heatmap'>('markers');
  const [data, setData] = useState<MapMarkerResponse | null>(null);
  const [heatCells, setHeatCells] = useState<HeatmapCell[] | null>(null);
  const [heatMeta, setHeatMeta] = useState<{ gridStepDegrees: number; maxCount: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [heatLoading, setHeatLoading] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestAbort = useRef<AbortController | null>(null);
  const [flyTo, setFlyTo] = useState<{
    latitude: number;
    longitude: number;
    nonce: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/map/markers');
        if (!cancelled && res.data.success) {
          setData(res.data.data);
        }
      } catch {
        if (!cancelled) setError('Não foi possível carregar o mapa.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mapView !== 'heatmap') return;
    let cancelled = false;
    (async () => {
      setHeatLoading(true);
      try {
        const res = await api.get('/map/heatmap');
        if (!cancelled && res.data.success) {
          setHeatCells(res.data.data.cells as HeatmapCell[]);
          setHeatMeta({
            gridStepDegrees: res.data.data.gridStepDegrees,
            maxCount: res.data.data.maxCount,
          });
        }
      } catch {
        if (!cancelled) {
          setHeatCells([]);
          setHeatMeta(null);
        }
      } finally {
        if (!cancelled) setHeatLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapView]);

  const allPoints = useMemo(() => {
    if (!data) return [];
    const pts: L.LatLngExpression[] = [];
    data.cases.forEach((c) => pts.push([c.latitude, c.longitude]));
    data.tips.forEach((t) => pts.push([t.latitude, t.longitude]));
    data.sightings.forEach((s) => pts.push([s.latitude, s.longitude]));
    return pts;
  }, [data]);

  const heatPoints = useMemo(() => {
    if (!heatCells?.length) return [];
    return heatCells.map((c) => [c.latitude, c.longitude] as L.LatLngExpression);
  }, [heatCells]);

  const center = useMemo(() => {
    if (mapView === 'heatmap' && heatPoints.length > 0) {
      const b = L.latLngBounds(heatPoints);
      return b.getCenter();
    }
    if (allPoints.length === 0) return BRAZIL_CENTER;
    const b = L.latLngBounds(allPoints);
    return b.getCenter();
  }, [allPoints, heatPoints, mapView]);

  const applySuggestion = useCallback((s: GeocodeSuggestion) => {
    setAddressSearch(s.label);
    setSuggestions([]);
    setSuggestOpen(false);
    setFlyTo({ latitude: s.latitude, longitude: s.longitude, nonce: Date.now() });
  }, []);

  useEffect(() => {
    const q = addressSearch.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      suggestAbort.current?.abort();
      const ac = new AbortController();
      suggestAbort.current = ac;
      setSuggestLoading(true);
      void (async () => {
        try {
          const res = await api.get('/map/geocode/suggest', {
            params: { q },
            signal: ac.signal,
          });
          if (res.data.success && Array.isArray(res.data.data?.suggestions)) {
            setSuggestions(res.data.data.suggestions as GeocodeSuggestion[]);
            setSuggestOpen(true);
          }
        } catch (e: unknown) {
          if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'ERR_CANCELED')
            return;
          setSuggestions([]);
        } finally {
          setSuggestLoading(false);
        }
      })();
    }, 380);
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, [addressSearch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSuggestOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleGeocode = async () => {
    const q = addressSearch.trim();
    if (q.length < 3) return;
    setGeocodeLoading(true);
    setSuggestOpen(false);
    try {
      if (suggestions.length === 1) {
        applySuggestion(suggestions[0]);
        return;
      }
      const res = await api.get('/map/geocode', { params: { q } });
      if (res.data.success && res.data.data) {
        const { latitude, longitude, label } = res.data.data;
        setAddressSearch(typeof label === 'string' ? label : q);
        setFlyTo({ latitude, longitude, nonce: Date.now() });
      } else {
        window.alert(
          res.data.message ||
            'Endereço não encontrado no Brasil. Escolha uma sugestão da lista ou refine a busca.',
        );
      }
    } catch {
      window.alert('Não foi possível buscar o endereço.');
    } finally {
      setGeocodeLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
          Mapa colaborativo
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-dark tracking-tight flex items-center gap-3">
          <HiMap className="w-9 h-9 text-primary shrink-0" />
          Casos, dicas e avistamentos
        </h1>
        <p className="text-dark/75 mt-3 max-w-2xl">
          Visualize no mapa os últimos locais associados a casos ativos (quando há coordenadas),
          dicas georreferenciadas e avistamentos com foto. Ative o{' '}
          <strong className="font-semibold text-dark">mapa de calor</strong> para ver a densidade de
          ocorrências por região (agregação aproximada).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-dark/80 mr-2">Camada:</span>
        <Button
          type="button"
          variant={mapView === 'markers' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapView('markers')}
        >
          Marcadores
        </Button>
        <Button
          type="button"
          variant={mapView === 'heatmap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapView('heatmap')}
        >
          Mapa de calor
        </Button>
        {mapView === 'heatmap' && heatMeta && (
          <span className="text-xs text-muted ml-2">
            Grade ~{(heatMeta.gridStepDegrees * 111).toFixed(0)} km · máx. {heatMeta.maxCount}{' '}
            ocorrências/célula
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {mapView === 'markers' ? (
          <>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/25 border border-primary/40 text-dark font-medium">
              <span className="w-3 h-3 rounded-full bg-primary" />
              Caso (último local conhecido)
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted-bg/80 px-3 py-1 font-medium text-dark">
              <span className="w-3 h-3 rounded-full bg-forest" />
              Dica
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/25 border border-accent/40 text-dark font-medium">
              <span className="w-3 h-3 rounded-full bg-accent" />
              Avistamento
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted-bg/80 px-3 py-1 font-medium text-dark">
            Intensidade do calor: amarelo (baixa) → vermelho (alta) · passe o mouse na célula para
            detalhes
          </span>
        )}
        <Link
          to="/sightings"
          className="ml-auto text-primary font-semibold hover:underline"
        >
          Registrar avistamento →
        </Link>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar endereço ou lugar (apenas Brasil — ex.: Praça da Liberdade, Belo Horizonte)"
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setSuggestOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestOpen && suggestions[0]) {
                  applySuggestion(suggestions[0]);
                  return;
                }
                void handleGeocode();
              }
            }}
            className="pr-10"
            role="combobox"
            aria-expanded={suggestOpen}
            aria-controls="map-geocode-suggestions"
            aria-autocomplete="list"
            aria-label="Buscar local no mapa"
          />
          <HiMagnifyingGlass
            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          {suggestOpen && (suggestions.length > 0 || suggestLoading) && (
            <div
              id="map-geocode-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-64 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
            >
              {suggestLoading && suggestions.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted">Buscando sugestões…</p>
              )}
              {suggestions.map((s, i) => (
                <button
                  key={`${s.latitude}-${s.longitude}-${i}`}
                  type="button"
                  role="option"
                  className="w-full px-3 py-2.5 text-left text-sm text-dark hover:bg-muted-bg/80 border-b border-border/60 last:border-0"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  <span className="line-clamp-2">{s.label}</span>
                  {(s.type || s.category) && (
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {[s.category, s.type].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={() => void handleGeocode()}
          disabled={geocodeLoading || addressSearch.trim().length < 3}
          className="shrink-0"
        >
          {geocodeLoading ? 'Buscando…' : 'Ir para endereço'}
        </Button>
      </div>
      <p className="text-xs text-muted -mt-1 mb-3">
        Resultados limitados ao Brasil. Use as sugestões ou inclua cidade/estado para maior precisão.
      </p>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading && (
          <div className="h-[480px] flex items-center justify-center text-dark/70">
            Carregando mapa...
          </div>
        )}
        {error && (
          <div className="h-[480px] flex items-center justify-center text-accent px-4 text-center">
            {error}
          </div>
        )}
        {!loading && !error && data && mapView === 'markers' && (
          <MapContainer
            center={center}
            zoom={allPoints.length ? 12 : 4}
            className="h-[min(70vh,560px)] w-full z-0"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {allPoints.length > 0 && <FitBounds points={allPoints} />}
            {flyTo ? (
              <FlyToAddress
                latitude={flyTo.latitude}
                longitude={flyTo.longitude}
                nonce={flyTo.nonce}
              />
            ) : null}

            {data.cases.map((c) => (
              <CircleMarker
                key={`case-${c.id}`}
                center={[c.latitude, c.longitude]}
                radius={10}
                pathOptions={{
                  color: '#4B2C32',
                  fillColor: '#F58498',
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-semibold text-dark">{c.title}</p>
                    <p className="text-sm text-dark/80">{c.missingPersonName}</p>
                    {c.lastSeenLocation && (
                      <p className="text-xs mt-1 text-dark/70">{c.lastSeenLocation}</p>
                    )}
                    <Link
                      to={`/cases/${c.id}`}
                      className="text-primary text-sm font-medium mt-2 inline-block hover:underline"
                    >
                      Ver caso
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {data.tips.map((t) => (
              <CircleMarker
                key={`tip-${t.id}`}
                center={[t.latitude, t.longitude]}
                radius={8}
                pathOptions={{
                  color: '#59755E',
                  fillColor: '#94a3b8',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="max-w-xs">
                    <p className="text-xs font-medium text-dark/70 mb-1">
                      Dica · {t.caseTitle}
                    </p>
                    <p className="text-sm text-dark whitespace-pre-wrap">{t.content}</p>
                    {t.location && (
                      <p className="text-xs text-dark/70 mt-1">{t.location}</p>
                    )}
                    <Link
                      to={`/cases/${t.caseId}`}
                      className="text-primary text-sm font-medium mt-2 inline-block hover:underline"
                    >
                      Abrir caso
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {data.sightings.map((s) => (
              <CircleMarker
                key={`sighting-${s.id}`}
                center={[s.latitude, s.longitude]}
                radius={9}
                pathOptions={{
                  color: '#59755E',
                  fillColor: '#84F598',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="max-w-xs">
                    <p className="text-xs font-medium text-dark/70 mb-1">
                      Avistamento · {s.caseTitle}
                    </p>
                    {s.description && (
                      <p className="text-sm text-dark mb-2">{s.description}</p>
                    )}
                    <img
                      src={s.photoUrl}
                      alt="Avistamento"
                      className="w-full rounded-lg object-cover max-h-36"
                    />
                    <Link
                      to={`/cases/${s.caseId}`}
                      className="text-primary text-sm font-medium mt-2 inline-block hover:underline"
                    >
                      Ver caso
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}

        {!loading && !error && data && mapView === 'heatmap' && (
          <div className="relative h-[min(70vh,560px)] w-full">
            {heatLoading && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center bg-card/80 text-dark text-sm">
                Carregando mapa de calor…
              </div>
            )}
            <MapContainer
              center={center}
              zoom={heatPoints.length ? 5 : 4}
              className="h-full w-full z-0"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {heatPoints.length > 0 && <FitBounds points={heatPoints} />}
              {flyTo ? (
                <FlyToAddress
                  latitude={flyTo.latitude}
                  longitude={flyTo.longitude}
                  nonce={flyTo.nonce}
                />
              ) : null}
              {(heatCells ?? []).map((cell, idx) => (
                <CircleMarker
                  key={`heat-${cell.latitude}-${cell.longitude}-${idx}`}
                  center={[cell.latitude, cell.longitude]}
                  radius={22 + Math.min(58, cell.count * 9)}
                  pathOptions={{
                    color: '#3d2c32',
                    fillColor: heatFill(cell.intensity),
                    fillOpacity: 0.45 + cell.intensity * 0.35,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-semibold text-dark mb-1">
                        Região agregada · {cell.count} ponto(s)
                      </p>
                      <ul className="text-dark/80 text-xs space-y-0.5">
                        <li>Casos (último local): {cell.caseCount}</li>
                        <li>Dicas: {cell.tipCount}</li>
                        <li>Avistamentos: {cell.sightingCount}</li>
                      </ul>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      {!loading &&
        !error &&
        data &&
        mapView === 'markers' &&
        allPoints.length === 0 && (
        <p className="text-center text-dark/70 mt-6 text-sm">
          Ainda não há marcadores com coordenadas. Cadastre um caso com local no mapa, envie dicas
          com latitude/longitude ou{' '}
          <Link to="/sightings" className="text-primary font-medium hover:underline">
            registre um avistamento
          </Link>
          .
        </p>
      )}

      {!loading &&
        !error &&
        data &&
        mapView === 'heatmap' &&
        !heatLoading &&
        heatCells &&
        heatCells.length === 0 && (
          <p className="text-center text-dark/70 mt-6 text-sm">
            Não há dados georreferenciados suficientes para o mapa de calor. Quando houver casos,
            dicas ou avistamentos com coordenadas, as regiões aparecerão aqui.
          </p>
        )}
    </div>
  );
}
