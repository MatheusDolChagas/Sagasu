import { useCallback, useState, type MouseEvent } from 'react';
import {
  HiLink,
  HiShare,
} from 'react-icons/hi2';
import { FaFacebookF, FaInstagram, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import InstagramShareModal from './InstagramShareModal';
import { showShareCopiedToast } from './SharePopupHelpToast';
import {
  buildShareCaption,
  buildShortShareText,
  copyShareCaption,
  facebookShareUrl,
  linkedInShareUrl,
  openExternalShare,
} from '../lib/socialShare';

type ShareBarProps = {
  title: string;
  description?: string;
  url: string;
  /** Foto principal do caso (criação) para Instagram */
  imageUrl?: string;
  missingPersonName?: string;
};

export default function ShareBar({
  title,
  description,
  url,
  imageUrl,
  missingPersonName,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [instagramOpen, setInstagramOpen] = useState(false);

  const shareText = buildShortShareText(title, description, missingPersonName);
  const fullCaption = buildShareCaption(title, description, url, missingPersonName);

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

  const openNetworkShare = useCallback(
    async (e: MouseEvent, href: string, network: string, copyText: string) => {
      e.preventDefault();
      const copied = await copyShareCaption(copyText);
      openExternalShare(href);
      showShareCopiedToast(network, copied);
    },
    [],
  );

  const shareFacebook = useCallback(
    (e: MouseEvent) => {
      void openNetworkShare(e, facebookShareUrl(url), 'Facebook', fullCaption);
    },
    [url, fullCaption, openNetworkShare],
  );

  const shareLinkedIn = useCallback(
    (e: MouseEvent) => {
      void openNetworkShare(e, linkedInShareUrl(fullCaption), 'LinkedIn', fullCaption);
    },
    [fullCaption, openNetworkShare],
  );

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: fullCaption, url });
      } catch {
        // usuário cancelou
      }
    } else {
      copyLink();
    }
  }, [title, fullCaption, url, copyLink]);

  const links = [
    {
      label: 'WhatsApp',
      href: waHref,
      icon: <FaWhatsapp className="w-5 h-5" />,
      className: 'bg-[#25D366] text-white hover:opacity-95',
      onClick: undefined as ((e: MouseEvent) => void) | undefined,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`,
      icon: <FaXTwitter className="w-5 h-5" />,
      className: 'bg-zinc-900 text-white hover:opacity-95 dark:bg-zinc-100 dark:text-zinc-900',
      onClick: undefined,
    },
    {
      label: 'Facebook',
      href: facebookShareUrl(url),
      icon: <FaFacebookF className="w-5 h-5" />,
      className: 'bg-[#1877F2] text-white hover:opacity-95',
      onClick: shareFacebook,
    },
    {
      label: 'LinkedIn',
      href: linkedInShareUrl(fullCaption),
      icon: <FaLinkedin className="w-5 h-5" />,
      className: 'bg-[#0A66C2] text-white hover:opacity-95',
      onClick: shareLinkedIn,
    },
    {
      label: 'Instagram',
      href: '#',
      icon: <FaInstagram className="w-5 h-5" />,
      className:
        'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-95',
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        setInstagramOpen(true);
      },
    },
  ];

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <HiShare className="w-5 h-5 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-dark">Divulgar este caso</h3>
          <span className="text-xs text-muted hidden sm:inline">
            Redes sociais e canal direto
          </span>
        </div>
        <p className="text-xs text-muted mb-3">
          No Facebook e LinkedIn o texto é copiado automaticamente para você colar no post (Ctrl+V).
        </p>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.label === 'Instagram' || l.onClick ? undefined : '_blank'}
              rel={l.label === 'Instagram' || l.onClick ? undefined : 'noopener noreferrer'}
              title={l.label}
              onClick={l.onClick}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-opacity ${l.className}`}
              aria-label={l.label}
            >
              {l.icon}
            </a>
          ))}
          <button
            type="button"
            onClick={() => void copyShareCaption(fullCaption).then((ok) => {
              if (ok) toast.success('Texto completo copiado para colar na rede social');
              else toast.error('Não foi possível copiar o texto');
            })}
            title="Copiar texto da publicação"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-xs font-medium text-dark hover:bg-muted-bg/80"
          >
            Copiar texto
          </button>
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

      <InstagramShareModal
        open={instagramOpen}
        onClose={() => setInstagramOpen(false)}
        title={title}
        description={description}
        url={url}
        imageUrl={imageUrl}
        missingPersonName={missingPersonName}
      />
    </>
  );
}
