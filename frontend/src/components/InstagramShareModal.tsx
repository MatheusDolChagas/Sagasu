import { useEffect, useRef, useState } from 'react';
import { HiXMark, HiArrowDownTray, HiClipboard, HiPaperAirplane } from 'react-icons/hi2';
import { FaInstagram } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  buildShareCaption,
  downloadImageFromUrl,
  openInstagramAppOrWeb,
  shareImageWithCaption,
} from '../lib/socialShare';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  missingPersonName?: string;
};

export default function InstagramShareModal({
  open,
  onClose,
  title,
  description,
  url,
  imageUrl,
  missingPersonName,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCaption(buildShareCaption(title, description, url, missingPersonName));
  }, [open, title, description, url, missingPersonName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success('Legenda copiada');
    } catch {
      toast.error('Não foi possível copiar a legenda');
    }
  };

  const downloadPhoto = async () => {
    if (!imageUrl) {
      toast.error('Este caso não tem foto principal para baixar');
      return;
    }
    setBusy(true);
    try {
      await downloadImageFromUrl(imageUrl, `sagasu-${title.slice(0, 40).replace(/\s+/g, '-')}.jpg`);
      toast.success('Imagem baixada — use no Instagram ao criar o post');
    } catch {
      toast.error('Não foi possível baixar a imagem. Tente clicar com o botão direito na foto.');
    } finally {
      setBusy(false);
    }
  };

  const publishFlow = async () => {
    setBusy(true);
    try {
      await copyCaption();
      if (imageUrl) {
        const shared = await shareImageWithCaption(imageUrl, caption, title);
        if (!shared) {
          try {
            await downloadImageFromUrl(
              imageUrl,
              `sagasu-${title.slice(0, 40).replace(/\s+/g, '-')}.jpg`,
            );
            toast.success('Legenda copiada e imagem baixada — abra o Instagram para publicar');
          } catch {
            toast.success('Legenda copiada — baixe a foto e publique no Instagram');
          }
        }
      } else {
        toast.success('Legenda copiada — adicione uma foto no Instagram');
      }
      openInstagramAppOrWeb();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagram-share-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={() => !busy && onClose()}
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 bg-gradient-to-r from-[#f09433]/20 via-[#dc2743]/20 to-[#bc1888]/20">
          <div className="flex items-center gap-2">
            <FaInstagram className="w-5 h-5 text-[#E1306C]" aria-hidden />
            <h2 id="instagram-share-title" className="text-sm font-semibold text-dark">
              Publicar no Instagram
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full p-1 text-dark/70 hover:bg-muted-bg/80"
            aria-label="Fechar"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[min(80vh,640px)] overflow-y-auto">
          <p className="text-xs text-dark/70">
            Pré-visualização do post. No celular, você pode compartilhar direto; no computador,
            baixe a foto e cole a legenda no Instagram.
          </p>

          <div className="rounded-xl border border-border overflow-hidden bg-zinc-950 shadow-inner">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]" />
              <span className="text-xs font-semibold text-white">sagasu.busca</span>
            </div>
            <div className="aspect-square bg-zinc-900 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={missingPersonName ?? title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="text-sm text-white/60 px-6 text-center">
                  Sem foto do caso — adicione uma imagem manualmente no Instagram
                </p>
              )}
            </div>
            <div className="px-3 py-2 text-xs text-white/90 whitespace-pre-wrap line-clamp-4">
              {caption}
            </div>
          </div>

          <div>
            <label htmlFor="ig-caption" className="block text-xs font-medium text-dark mb-1">
              Legenda (editável)
            </label>
            <textarea
              id="ig-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-muted-bg/30 px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void publishFlow()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              <HiPaperAirplane className="w-4 h-4" />
              {busy ? 'Preparando…' : 'Publicar no Instagram'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy || !imageUrl}
                onClick={() => void downloadPhoto()}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-dark hover:bg-muted-bg/80 disabled:opacity-50"
              >
                <HiArrowDownTray className="w-4 h-4" />
                Baixar foto
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void copyCaption()}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-dark hover:bg-muted-bg/80 disabled:opacity-50"
              >
                <HiClipboard className="w-4 h-4" />
                Copiar legenda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
