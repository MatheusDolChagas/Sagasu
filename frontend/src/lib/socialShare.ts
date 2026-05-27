export function buildShareCaption(
  title: string,
  description: string | undefined,
  url: string,
  missingPersonName?: string,
): string {
  const headline = missingPersonName
    ? `${title} — ${missingPersonName}`
    : title;
  const excerpt = description
    ? `${description.slice(0, 200)}${description.length > 200 ? '…' : ''}`
    : '';
  const parts = [
    '🔍 Ajude na busca — Sagasu',
    headline,
    excerpt,
    `Saiba mais e colabore: ${url}`,
    '#Sagasu #Desaparecido #BuscaColaborativa',
  ].filter(Boolean);
  return parts.join('\n\n');
}

export function buildShortShareText(
  title: string,
  description: string | undefined,
  missingPersonName?: string,
): string {
  const headline = missingPersonName
    ? `${title} — ${missingPersonName}`
    : title;
  if (description) {
    const excerpt = description.slice(0, 140);
    return `${headline} — ${excerpt}${description.length > 140 ? '…' : ''}`;
  }
  return headline;
}

/** Facebook só garante o link; texto completo vai via área de transferência. */
export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function linkedInShareUrl(caption: string): string {
  const params = new URLSearchParams({
    shareActive: 'true',
    text: caption,
  });
  return `https://www.linkedin.com/feed/?${params.toString()}`;
}

export async function downloadImageFromUrl(imageUrl: string, filename: string): Promise<void> {
  const res = await fetch(imageUrl, { mode: 'cors' });
  if (!res.ok) throw new Error('Falha ao baixar imagem');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function shareImageWithCaption(
  imageUrl: string,
  caption: string,
  title: string,
): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) return false;
    const blob = await res.blob();
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    const file = new File([blob], `sagasu-caso.${ext}`, { type: blob.type || 'image/jpeg' });
    const payload = { files: [file], text: caption, title };
    if (!navigator.canShare(payload)) return false;
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}

export async function copyShareCaption(caption: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(caption);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre link em nova aba a partir do clique do usuário (evita falso “pop-up bloqueado”).
 */
export function openExternalShare(href: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export const POPUP_HELP_STEPS = [
  'Clique no ícone de “pop-up bloqueado” na barra de endereço do navegador (à direita da URL).',
  'Selecione “Sempre permitir pop-ups e redirecionamentos” para este site.',
  'Volte aqui e clique em compartilhar novamente.',
] as const;

export function openInstagramAppOrWeb(): void {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = 'instagram://camera';
    window.setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }, 600);
  } else {
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  }
}
