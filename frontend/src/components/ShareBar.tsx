import { useCallback, useState } from 'react';
import {
  HiLink,
  HiShare,
} from 'react-icons/hi2';
import { FaFacebookF, FaInstagram, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';

type ShareBarProps = {
  title: string;
  description?: string;
  url: string;
};

export default function ShareBar({ title, description, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const shareText = description
    ? `${title} — ${description.slice(0, 140)}${description.length > 140 ? '…' : ''}`
    : title;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareText}\n\n${url}`);

  const waHref = `https://wa.me/?text=${encodedText}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  }, [url]);

  const copyForInstagram = useCallback(async () => {
    const igCaption = `${shareText}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(igCaption);
      toast.success('Texto copiado — cole no Instagram (legenda ou Stories)');
    } catch {
      toast.error('Não foi possível copiar');
    }
  }, [shareText, url]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
      } catch {
        // usuário cancelou
      }
    } else {
      copyLink();
    }
  }, [title, shareText, url, copyLink]);

  const links = [
    {
      label: 'WhatsApp',
      href: waHref,
      icon: <FaWhatsapp className="w-5 h-5" />,
      className: 'bg-[#25D366] text-white hover:opacity-95',
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`,
      icon: <FaXTwitter className="w-5 h-5" />,
      className: 'bg-zinc-900 text-white hover:opacity-95 dark:bg-zinc-100 dark:text-zinc-900',
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FaFacebookF className="w-5 h-5" />,
      className: 'bg-[#1877F2] text-white hover:opacity-95',
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <FaLinkedin className="w-5 h-5" />,
      className: 'bg-[#0A66C2] text-white hover:opacity-95',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/',
      icon: <FaInstagram className="w-5 h-5" />,
      className:
        'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-95',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <HiShare className="w-5 h-5 text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-dark">Divulgar este caso</h3>
        <span className="text-xs text-muted hidden sm:inline">
          Redes sociais e canal direto
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) =>
          l.label === 'Instagram' ? (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              title={`${l.label}: abre o app/site e copia legenda`}
              onClick={() => void copyForInstagram()}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-opacity ${l.className}`}
              aria-label={`${l.label}: copiar texto para colar no Instagram`}
            >
              {l.icon}
            </a>
          ) : (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              title={l.label}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-opacity ${l.className}`}
              aria-label={l.label}
            >
              {l.icon}
            </a>
          ),
        )}
        <button
          type="button"
          onClick={copyLink}
          title="Copiar link"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-dark hover:bg-muted-bg/80"
          aria-label="Copiar link"
        >
          <HiLink className="w-5 h-5" />
        </button>
        {'share' in navigator && (
          <button
            type="button"
            onClick={nativeShare}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-95"
          >
            Compartilhar…
          </button>
        )}
      </div>
      {copied && (
        <p className="mt-2 text-xs text-muted">Link copiado para a área de transferência.</p>
      )}
    </div>
  );
}
