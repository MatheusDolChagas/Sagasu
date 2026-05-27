/**
 * Validação de imagens (tipo/tamanho + OpenAI: moderação e visão).
 *
 * Variáveis de ambiente:
 * - OPENAI_API_KEY — obrigatório para validação por IA
 * - OPENAI_VISION_MODEL — padrão gpt-4o-mini
 * - OPENAI_MODERATION_MODEL — padrão omni-moderation-latest
 * - MEDIA_NSFW_THRESHOLD — score sexual para bloquear (0–1, padrão 0.82)
 * - MEDIA_AVATAR_PERSON_THRESHOLD — confiança mínima de pessoa no avatar (padrão 0.5)
 * - MEDIA_AVATAR_RELAXED — true força validação básica se IA falhar; em dev é padrão
 */

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 60_000;
const OPENAI_TIMEOUT_MS = 90_000;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type MediaValidationResult = {
  ok: boolean;
  mode: 'openai' | 'basic';
  nsfwScore?: number;
  reason?: string;
  warnings: string[];
};

export type MediaValidationContext = 'general' | 'avatar' | 'case_primary';

type VisionAnalysis = {
  acceptable: boolean;
  contains_person: boolean;
  person_confidence: number;
  reason?: string;
};

function sniffImageKind(buf: Buffer): 'jpeg' | 'png' | 'webp' | 'gif' | null {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return 'png';
  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString('ascii') === 'RIFF' &&
    buf.slice(8, 12).toString('ascii') === 'WEBP'
  )
    return 'webp';
  if (
    buf.length >= 6 &&
    (buf.slice(0, 6).toString('ascii') === 'GIF87a' ||
      buf.slice(0, 6).toString('ascii') === 'GIF89a')
  )
    return 'gif';
  return null;
}

function mimeFromSniff(kind: ReturnType<typeof sniffImageKind>): string {
  switch (kind) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

/** Mensagens técnicas → texto para o usuário. */
export function humanizeMediaValidationError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('aborted') || m.includes('abort')) {
    return 'A validação demorou demais (download ou análise da imagem). Tente uma foto menor ou aguarde e tente de novo.';
  }
  if (m.includes('timeout') || m.includes('timed out')) {
    return 'Tempo esgotado ao validar a imagem. Tente novamente em alguns instantes.';
  }
  return message;
}

function bufferToDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function fetchImageBytes(imageUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error('URL da imagem inválida');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Somente URLs http(s) são permitidas');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(imageUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'image/*' },
    });
    if (!r.ok) {
      throw new Error(`Não foi possível baixar a imagem para validação (HTTP ${r.status}).`);
    }
    const rawCt = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const cl = r.headers.get('content-length');
    if (cl) {
      const n = parseInt(cl, 10);
      if (Number.isFinite(n) && n > MAX_IMAGE_BYTES) {
        throw new Error('Imagem excede o tamanho máximo permitido');
      }
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) {
      throw new Error('Imagem excede o tamanho máximo permitido');
    }
    return { buffer: buf, contentType: rawCt };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        'Tempo esgotado ao baixar a imagem do armazenamento. Verifique sua conexão ou use uma foto menor.',
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function openAiFetch(path: string, body: unknown): Promise<Response> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    return await fetch(`https://api.openai.com/v1${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function moderateImageWithOpenAI(
  buffer: Buffer,
  mime: string,
): Promise<{ flagged: boolean; sexualScore: number }> {
  const model = process.env.OPENAI_MODERATION_MODEL?.trim() || 'omni-moderation-latest';
  const dataUrl = bufferToDataUrl(buffer, mime);

  const r = await openAiFetch('/moderations', {
    model,
    input: [{ type: 'image_url', image_url: { url: dataUrl } }],
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(t.slice(0, 220) || `OpenAI moderação HTTP ${r.status}`);
  }

  const json = (await r.json()) as {
    results?: Array<{
      flagged?: boolean;
      category_scores?: Record<string, number>;
    }>;
  };

  const row = json.results?.[0];
  if (!row) {
    throw new Error('Resposta de moderação inválida');
  }

  const scores = row.category_scores ?? {};
  const sexualScore = Math.max(
    Number(scores.sexual) || 0,
    Number(scores['sexual/minors']) || 0,
  );

  return {
    flagged: Boolean(row.flagged),
    sexualScore,
  };
}

function visionPrompt(context: MediaValidationContext): string {
  if (context === 'avatar') {
    return `Você valida fotos de perfil para uma plataforma brasileira de busca de idosos desaparecidos.
Analise a imagem e responda em JSON:
- acceptable: true somente se for adequada (sem nudez, violência gráfica, conteúdo sexual ou ofensivo) E houver pessoa humana
- contains_person: true APENAS se houver pelo menos uma pessoa humana real visível (aceite selfies, espelho, rosto parcial). Animais, objetos, memes, desenhos ou paisagens SEM pessoa = false
- person_confidence: 0 a 1 — confiança de que há uma pessoa humana na foto (0 para animal/objeto só)
- reason: mensagem curta em português se rejeitar (ex.: "A foto de perfil deve mostrar uma pessoa, não um animal"); omita se ok`;
  }
  return `Você valida a foto principal de um caso de pessoa desaparecida (idoso 60+) em plataforma brasileira.
A foto deve mostrar claramente a pessoa desaparecida (rosto ou corpo reconhecível).
Responda em JSON:
- acceptable: true se adequada ao contexto (sem conteúdo impróprio)
- contains_person: true se a pessoa desaparecida está visível
- person_confidence: 0 a 1
- reason: mensagem curta em português se rejeitar; omita se ok`;
}

async function analyzeImageWithOpenAI(
  buffer: Buffer,
  mime: string,
  context: MediaValidationContext,
): Promise<VisionAnalysis> {
  const model = process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini';
  const dataUrl = bufferToDataUrl(buffer, mime);

  const r = await openAiFetch('/chat/completions', {
    model,
    temperature: 0.1,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: visionPrompt(context) },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
        ],
      },
    ],
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(t.slice(0, 220) || `OpenAI visão HTTP ${r.status}`);
  }

  const json = (await r.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Resposta de visão vazia');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Resposta de visão não é JSON válido');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Formato de visão inválido');
  }

  const o = parsed as Record<string, unknown>;
  const personConfidence = Number(o.person_confidence);
  return {
    acceptable: Boolean(o.acceptable),
    contains_person: Boolean(o.contains_person),
    person_confidence: Number.isFinite(personConfidence)
      ? Math.min(1, Math.max(0, personConfidence))
      : 0,
    reason: typeof o.reason === 'string' ? o.reason : undefined,
  };
}

/** Só com MEDIA_AVATAR_RELAXED=true — nunca em erro de API/chave inválida. */
function isAvatarRelaxedMode(): boolean {
  return process.env.MEDIA_AVATAR_RELAXED === 'true';
}

function isOpenAiCredentialOrConfigError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('incorrect api key') ||
    m.includes('invalid api key') ||
    m.includes('invalid_request_error') ||
    m.includes('authentication') ||
    m.includes('unauthorized') ||
    m.includes('you can find your api key') ||
    m.includes('api key not configured') ||
    m.includes('openai_api_key')
  );
}

function openAiFailureReason(msg: string, context: MediaValidationContext): string {
  if (isOpenAiCredentialOrConfigError(msg)) {
    return 'Chave da OpenAI inválida ou ausente no servidor. Corrija OPENAI_API_KEY no .env do backend e reinicie o processo.';
  }
  if (context === 'avatar') {
    return 'Não foi possível validar a foto de perfil agora. Tente novamente em alguns instantes.';
  }
  if (context === 'case_primary') {
    return 'Não foi possível validar a foto principal do caso agora. Tente novamente em alguns instantes.';
  }
  return 'Não foi possível validar a imagem agora. Tente novamente em alguns instantes.';
}

function avatarRelaxedAllowed(buffer: Buffer, errorMessage: string): boolean {
  if (!isAvatarRelaxedMode() || isOpenAiCredentialOrConfigError(errorMessage)) return false;
  const sniff = sniffImageKind(buffer);
  if (!sniff) return false;
  return buffer.length >= 8 * 1024;
}

/**
 * Valida URL de imagem (rede pública). Usar após upload para storage ou antes de persistir no caso/avistamento.
 */
export async function validateImageUrlForPlatform(
  imageUrl: string,
  context: MediaValidationContext = 'general',
): Promise<MediaValidationResult> {
  const warnings: string[] = [];
  const { buffer, contentType } = await fetchImageBytes(imageUrl);

  const sniff = sniffImageKind(buffer);
  const mime =
    (contentType && ALLOWED_MIME.has(contentType) ? contentType : null) ||
    mimeFromSniff(sniff);

  if (!sniff && !(contentType && ALLOWED_MIME.has(contentType))) {
    return {
      ok: false,
      mode: 'basic',
      reason: 'Arquivo não parece ser uma imagem suportada (JPEG, PNG, WebP ou GIF).',
      warnings,
    };
  }
  if (contentType && !ALLOWED_MIME.has(contentType) && sniff) {
    warnings.push('Content-Type não era de imagem; formato confirmado pela assinatura do arquivo.');
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    if (context === 'avatar' && avatarRelaxedAllowed(buffer, '')) {
      warnings.push('OPENAI_API_KEY ausente; validação básica aplicada (MEDIA_AVATAR_RELAXED=true).');
      return { ok: true, mode: 'basic', warnings };
    }
    return {
      ok: false,
      mode: 'basic',
      reason:
        'Validação automática não configurada. Defina OPENAI_API_KEY no .env do backend e reinicie o servidor.',
      warnings,
    };
  }

  const nsfwThreshold = Math.min(
    0.99,
    Math.max(0.5, parseFloat(process.env.MEDIA_NSFW_THRESHOLD || '0.82') || 0.82),
  );

  try {
    const personThreshold = Math.min(
      0.95,
      Math.max(
        0.2,
        parseFloat(
          context === 'avatar'
            ? process.env.MEDIA_AVATAR_PERSON_THRESHOLD || '0.5'
            : process.env.MEDIA_CASE_PRIMARY_PERSON_THRESHOLD || '0.55',
        ) || 0.5,
      ),
    );

    let moderation: Awaited<ReturnType<typeof moderateImageWithOpenAI>>;
    let vision: VisionAnalysis | null = null;

    if (context === 'general') {
      moderation = await moderateImageWithOpenAI(buffer, mime);
    } else {
      try {
        const [mod, vis] = await Promise.all([
          moderateImageWithOpenAI(buffer, mime),
          analyzeImageWithOpenAI(buffer, mime, context),
        ]);
        moderation = mod;
        vision = vis;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'falha na visão';
        if (context === 'avatar' && avatarRelaxedAllowed(buffer, msg)) {
          warnings.push('Validação básica (modo relaxado) após falha da IA.');
          return { ok: true, mode: 'basic', warnings };
        }
        warnings.push(`Análise indisponível: ${msg.slice(0, 120)}`);
        return {
          ok: false,
          mode: 'openai',
          reason: openAiFailureReason(msg, context),
          warnings,
        };
      }
    }

    const nsfwScore = moderation.sexualScore;

    if (moderation.flagged || nsfwScore >= nsfwThreshold) {
      return {
        ok: false,
        mode: 'openai',
        nsfwScore,
        reason:
          'Esta imagem foi recusada pelo filtro automático de conteúdo. Envie uma foto adequada ao contexto de busca de pessoas.',
        warnings,
      };
    }

    if (context === 'general') {
      return { ok: true, mode: 'openai', nsfwScore, warnings };
    }

    const visionResult = vision as VisionAnalysis;

    if (!visionResult.acceptable) {
      return {
        ok: false,
        mode: 'openai',
        nsfwScore,
        reason:
          visionResult.reason ||
          'Imagem não adequada para esta plataforma. Escolha outra foto.',
        warnings,
      };
    }

    const personOk =
      visionResult.contains_person && visionResult.person_confidence >= personThreshold;

    if (personOk) {
      return { ok: true, mode: 'openai', nsfwScore, warnings };
    }

    if (context === 'avatar' && avatarRelaxedAllowed(buffer, '')) {
      warnings.push(
        'Pessoa não confirmada com alta confiança; foto aceita em modo relaxado (MEDIA_AVATAR_RELAXED=true).',
      );
      return { ok: true, mode: 'openai', nsfwScore, warnings };
    }

    return {
      ok: false,
      mode: 'openai',
      nsfwScore,
      reason:
        visionResult.reason ||
        (context === 'avatar'
          ? 'A foto de perfil deve mostrar claramente uma pessoa. Selfies e fotos de rosto são aceitas quando a pessoa está visível.'
          : 'A foto principal deve mostrar claramente a pessoa desaparecida. Para roupas e objetos, use anexos no detalhe do caso.'),
      warnings,
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'falha na API OpenAI';
    const msg = humanizeMediaValidationError(raw);
    if (context === 'avatar' && avatarRelaxedAllowed(buffer, raw)) {
      warnings.push('Validação básica após erro (modo relaxado explícito).');
      return { ok: true, mode: 'basic', warnings };
    }
    warnings.push(`OpenAI: ${raw.slice(0, 120)}`);
    return {
      ok: false,
      mode: 'basic',
      reason: openAiFailureReason(raw, context) || msg,
      warnings,
    };
  }
}
