import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24 h

const RESEND_DEFAULT_FROM = 'onboarding@resend.dev';

export function generateVerificationToken(): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) };
}

function confirmationLink(token: string): string {
  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

function getFromAddress(): string {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return RESEND_DEFAULT_FROM;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  if (raw.includes('<') && raw.includes('>')) return raw;
  if (raw.includes(' ') && !raw.includes('@')) {
    return RESEND_DEFAULT_FROM;
  }
  return raw;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getMailer() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

async function sendViaResend(
  to: string,
  subject: string,
  text: string,
  html: string,
): Promise<{ id?: string }> {
  const resend = getResendClient();
  if (!resend) return {};

  const from = getFromAddress();
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(formatResendError(error.message));
  }

  return { id: data?.id };
}

async function sendViaSmtp(
  to: string,
  subject: string,
  text: string,
  html: string,
): Promise<boolean> {
  const transport = getMailer();
  if (!transport) return false;
  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
  return true;
}

function formatResendError(message: unknown): string {
  const raw = typeof message === 'string' ? message : JSON.stringify(message).slice(0, 400);
  const onlyOwn = /only send testing emails to your own email address/i.test(raw);
  if (onlyOwn) {
    const match = raw.match(/\(([^)]+)\)/);
    const allowed = match?.[1] ?? 'o email da sua conta Resend';
    return `O provedor de email em teste só envia para ${allowed}. Verifique o domínio no painel do Resend ou use o link exibido na tela após o cadastro.`;
  }
  if (/verify a domain|not verified/i.test(raw)) {
    return 'O domínio do remetente ainda não foi verificado no Resend. Conclua a verificação DNS e tente novamente.';
  }
  return raw;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SendVerificationResult = {
  sent: boolean;
  devLink?: string;
  channel?: string;
  emailError?: string;
};

export async function sendSignupVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<SendVerificationResult> {
  const link = confirmationLink(token);
  const subject = 'Confirme seu cadastro — Sagasu';
  const text = `Olá, ${name}.\n\nConfirme seu cadastro no Sagasu abrindo o link abaixo (válido por 24 horas):\n\n${link}\n\nSe você não criou esta conta, ignore este email.\n`;
  const html = `
    <p>Olá, <strong>${escapeHtml(name)}</strong>.</p>
    <p>Confirme seu cadastro no Sagasu clicando no botão abaixo (link válido por <strong>24 horas</strong>):</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#c94f6d;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Confirmar minha conta</a></p>
    <p style="font-size:12px;color:#666;">Ou copie e cole no navegador:<br/><span style="word-break:break-all;">${escapeHtml(link)}</span></p>
    <p style="font-size:12px;color:#666;">Se você não criou esta conta, ignore este email.</p>
  `;

  if (getResendClient()) {
    try {
      await sendViaResend(to, subject, text, html);
      return { sent: true, channel: 'resend' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao enviar via Resend';
      console.error('[email] Resend falhou:', msg);
      return {
        sent: false,
        channel: 'resend',
        emailError: msg,
        devLink: link,
      };
    }
  }

  if (getMailer()) {
    try {
      await sendViaSmtp(to, subject, text, html);
      return { sent: true, channel: 'smtp' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro SMTP';
      console.error('[email] SMTP falhou:', e);
      return { sent: false, channel: 'smtp', emailError: msg, devLink: link };
    }
  }

  return { sent: false, devLink: link, channel: 'none' };
}

export function devVerificationLinkIfAllowed(token: string): string | undefined {
  if (process.env.NODE_ENV !== 'development') return undefined;
  return confirmationLink(token);
}
