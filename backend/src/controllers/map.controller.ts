import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

const HEAT_GRID_STEP_DEG = 0.12;

function heatBucket(lat: number, lng: number) {
  const latitude = Math.round(lat / HEAT_GRID_STEP_DEG) * HEAT_GRID_STEP_DEG;
  const longitude = Math.round(lng / HEAT_GRID_STEP_DEG) * HEAT_GRID_STEP_DEG;
  return { latitude, longitude, key: `${latitude.toFixed(4)}:${longitude.toFixed(4)}` };
}

export const getMapMarkers = async (req: Request, res: Response) => {
  try {
    const [cases, tips, sightings] = await Promise.all([
      prisma.case.findMany({
        where: {
          status: 'ACTIVE',
          lastSeenLatitude: { not: null },
          lastSeenLongitude: { not: null },
        },
        select: {
          id: true,
          title: true,
          missingPersonName: true,
          lastSeenLocation: true,
          lastSeenLatitude: true,
          lastSeenLongitude: true,
        },
      }),
      prisma.tip.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          content: true,
          location: true,
          latitude: true,
          longitude: true,
          caseId: true,
          case: {
            select: { title: true, missingPersonName: true },
          },
        },
      }),
      prisma.sighting.findMany({
        select: {
          id: true,
          description: true,
          latitude: true,
          longitude: true,
          photoUrl: true,
          createdAt: true,
          caseId: true,
          case: {
            select: { title: true, missingPersonName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    res.json({
      success: true,
      data: {
        cases: cases.map((c) => ({
          type: 'case' as const,
          id: c.id,
          title: c.title,
          missingPersonName: c.missingPersonName,
          lastSeenLocation: c.lastSeenLocation,
          latitude: c.lastSeenLatitude!,
          longitude: c.lastSeenLongitude!,
        })),
        tips: tips.map((t) => ({
          type: 'tip' as const,
          id: t.id,
          content: t.content,
          location: t.location,
          latitude: t.latitude!,
          longitude: t.longitude!,
          caseId: t.caseId,
          caseTitle: t.case.title,
          caseMissingPersonName: t.case.missingPersonName,
        })),
        sightings: sightings.map((s) => ({
          type: 'sighting' as const,
          id: s.id,
          description: s.description,
          latitude: s.latitude,
          longitude: s.longitude,
          photoUrl: s.photoUrl,
          createdAt: s.createdAt,
          caseId: s.caseId,
          caseTitle: s.case.title,
          caseMissingPersonName: s.case.missingPersonName,
        })),
      },
    });
  } catch (error) {
    console.error('Get map markers error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dados do mapa',
    });
  }
};

export const getMapHeatmap = async (_req: Request, res: Response) => {
  try {
    const [cases, tips, sightings] = await Promise.all([
      prisma.case.findMany({
        where: {
          status: 'ACTIVE',
          lastSeenLatitude: { not: null },
          lastSeenLongitude: { not: null },
        },
        select: { lastSeenLatitude: true, lastSeenLongitude: true },
      }),
      prisma.tip.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        select: { latitude: true, longitude: true },
      }),
      prisma.sighting.findMany({
        select: { latitude: true, longitude: true },
        take: 2000,
      }),
    ]);

    type Cell = {
      latitude: number;
      longitude: number;
      count: number;
      caseCount: number;
      tipCount: number;
      sightingCount: number;
    };

    const map = new Map<string, Cell>();

    const add = (lat: number, lng: number, kind: 'case' | 'tip' | 'sighting') => {
      const { latitude, longitude, key } = heatBucket(lat, lng);
      const prev =
        map.get(key) ?? {
          latitude,
          longitude,
          count: 0,
          caseCount: 0,
          tipCount: 0,
          sightingCount: 0,
        };
      prev.count += 1;
      if (kind === 'case') prev.caseCount += 1;
      if (kind === 'tip') prev.tipCount += 1;
      if (kind === 'sighting') prev.sightingCount += 1;
      map.set(key, prev);
    };

    for (const c of cases) {
      add(c.lastSeenLatitude!, c.lastSeenLongitude!, 'case');
    }
    for (const t of tips) {
      add(t.latitude!, t.longitude!, 'tip');
    }
    for (const s of sightings) {
      add(s.latitude, s.longitude, 'sighting');
    }

    const cells = Array.from(map.values());
    const maxCount = cells.reduce((m, c) => Math.max(m, c.count), 0) || 1;
    const normalized = cells.map((c) => ({
      ...c,
      intensity: Math.round((c.count / maxCount) * 1000) / 1000,
    }));

    res.json({
      success: true,
      data: {
        gridStepDegrees: HEAT_GRID_STEP_DEG,
        maxCount,
        cells: normalized,
      },
    });
  } catch (error) {
    console.error('Get map heatmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar mapa de calor',
    });
  }
};

const geocodeQuerySchema = z.object({
  q: z.string().min(3, 'Digite pelo menos 3 caracteres').max(200),
  city: z.string().max(80).optional(),
});

const NOMINATIM_UA = 'Sagasu/1.0 (contato via plataforma Sagasu)';
const GEO_FETCH_TIMEOUT_MS = 12_000;

type GeocodeHit = {
  lat: string;
  lon: string;
  display_name?: string;
  type?: string;
  class?: string;
  importance?: number;
};

type GeocodeBias = { lat: number; lon: number; viewbox?: string };

const CITY_BIAS: Record<string, GeocodeBias> = {
  'belo horizonte': { lat: -19.9167, lon: -43.9345, viewbox: '-44.15,-19.80,-43.85,-20.05' },
  bh: { lat: -19.9167, lon: -43.9345, viewbox: '-44.15,-19.80,-43.85,-20.05' },
};

function hasRegionHint(q: string): boolean {
  const lower = q.toLowerCase();
  return (
    lower.includes('brasil') ||
    lower.includes('brazil') ||
    /\bmg\b/.test(lower) ||
    lower.includes('minas gerais') ||
    lower.includes('belo horizonte') ||
    /\bbh\b/.test(lower) ||
    lower.includes(', sp') ||
    lower.includes('são paulo') ||
    lower.includes('rio de janeiro')
  );
}

function buildSearchQueries(q: string, cityHint?: string): string[] {
  const trimmed = q.trim();
  const compact = trimmed.replace(/,\s*/g, ' ').replace(/\s+/g, ' ');
  const out = [trimmed];
  if (compact !== trimmed) out.push(compact);

  const city =
    cityHint?.trim() ||
    process.env.GEOCODE_DEFAULT_CITY?.trim() ||
    '';

  if (city && !hasRegionHint(trimmed)) {
    out.unshift(`${compact}, ${city}, MG, Brasil`);
  } else if (!hasRegionHint(trimmed)) {
    out.push(`${compact}, Brasil`);
  }

  return [...new Set(out.map((s) => s.trim()).filter((s) => s.length >= 3))].slice(0, 2);
}

async function fetchGeocodeHttp(url: string): Promise<globalThis.Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), GEO_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: ac.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': NOMINATIM_UA,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function resolveBias(cityHint?: string): GeocodeBias | undefined {
  const key = (cityHint || process.env.GEOCODE_DEFAULT_CITY || '').trim().toLowerCase();
  if (!key) return undefined;
  return CITY_BIAS[key] ?? undefined;
}

function dedupeHits(hits: GeocodeHit[], limit: number): GeocodeHit[] {
  const seen = new Set<string>();
  const out: GeocodeHit[] = [];
  for (const hit of hits) {
    const lat = parseFloat(hit.lat);
    const lon = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const key = `${lat.toFixed(5)}:${lon.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

function nominatimSearchUrl(query: string, limit: number, bias?: GeocodeBias): string {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('addressdetails', '1');
  if (bias?.viewbox) {
    url.searchParams.set('viewbox', bias.viewbox);
    url.searchParams.set('bounded', '0');
  }
  return url.toString();
}

async function fetchNominatim(
  query: string,
  limit: number,
  bias?: GeocodeBias,
): Promise<GeocodeHit[]> {
  const r = await fetchGeocodeHttp(nominatimSearchUrl(query, limit, bias));
  if (!r.ok) {
    throw new Error(`Nominatim HTTP ${r.status}`);
  }
  return (await r.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
    type?: string;
    class?: string;
    importance?: number;
  }>;
}

async function fetchPhotonBrazilFallback(
  query: string,
  limit: number,
  bias?: GeocodeBias,
): Promise<GeocodeHit[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(Math.min(limit * 2, 15)));
  url.searchParams.set('lang', 'pt');
  if (bias) {
    url.searchParams.set('lat', String(bias.lat));
    url.searchParams.set('lon', String(bias.lon));
  }

  const r = await fetchGeocodeHttp(url.toString());
  if (!r.ok) {
    throw new Error(`Photon HTTP ${r.status}`);
  }

  const payload = (await r.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        countrycode?: string;
        name?: string;
        street?: string;
        housenumber?: string;
        district?: string;
        city?: string;
        state?: string;
        country?: string;
        osm_value?: string;
        osm_key?: string;
      };
    }>;
  };

  const features = (payload.features ?? []).filter(
    (f) => f.properties?.countrycode?.toLowerCase() === 'br',
  );

  return features
    .slice(0, limit)
    .map((f) => {
      const lon = f.geometry?.coordinates?.[0];
      const lat = f.geometry?.coordinates?.[1];
      const p = f.properties ?? {};
      const streetLine = [p.street || p.name, p.housenumber].filter(Boolean).join(', ');
      const labelParts = [streetLine, p.district, p.city, p.state, p.country].filter(Boolean);
      return {
        lat: String(lat ?? ''),
        lon: String(lon ?? ''),
        display_name: labelParts.join(' — ').replace(' — Brasil', ', Brasil') || query,
        type: p.osm_value ?? undefined,
        class: p.osm_key ?? undefined,
      };
    })
    .filter((x) => x.lat !== '' && x.lon !== '');
}

async function fetchGeocodingWithFallback(
  query: string,
  limit: number,
  cityHint?: string,
): Promise<GeocodeHit[]> {
  const bias = resolveBias(cityHint);
  const queries = buildSearchQueries(query, cityHint);
  const merged: GeocodeHit[] = [];

  for (const q of queries) {
    if (merged.length >= limit) break;
    const need = limit - merged.length;
    const [photonSettled, nominatimSettled] = await Promise.allSettled([
      fetchPhotonBrazilFallback(q, need, bias),
      fetchNominatim(q, need, bias),
    ]);
    if (photonSettled.status === 'fulfilled') merged.push(...photonSettled.value);
    else console.warn('Photon:', photonSettled.reason);
    if (nominatimSettled.status === 'fulfilled') merged.push(...nominatimSettled.value);
    else console.warn('Nominatim:', nominatimSettled.reason);
  }

  return dedupeHits(merged, limit);
}

export const geocodeSuggest = async (req: Request, res: Response) => {
  try {
    const { q, city } = geocodeQuerySchema.parse(req.query);
    const raw = await fetchGeocodingWithFallback(q, 8, city);
    const suggestions = raw.map((hit) => ({
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
      label: hit.display_name ?? q,
      type: hit.type ?? null,
      category: hit.class ?? null,
    }));
    res.json({ success: true, data: { suggestions } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Consulta inválida',
        errors: error.errors,
      });
    }
    console.error('Geocode suggest error:', error);
    res.json({
      success: true,
      data: { suggestions: [] },
      message: 'Sugestões indisponíveis no momento',
    });
  }
};

export const geocodeAddress = async (req: Request, res: Response) => {
  try {
    const { q, city } = geocodeQuerySchema.parse(req.query);
    const raw = await fetchGeocodingWithFallback(q, 1, city);

    if (!raw.length) {
      return res.json({
        success: true,
        data: null,
        message: 'Endereço não encontrado no Brasil. Refine a busca ou escolha uma sugestão.',
      });
    }

    const hit = raw[0];
    res.json({
      success: true,
      data: {
        latitude: parseFloat(hit.lat),
        longitude: parseFloat(hit.lon),
        label: hit.display_name ?? q,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Consulta inválida',
        errors: error.errors,
      });
    }
    console.error('Geocode error:', error);
    res.status(502).json({
      success: false,
      message: 'Serviço de geocodificação indisponível',
    });
  }
};
