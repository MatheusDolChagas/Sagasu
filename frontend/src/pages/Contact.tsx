import { useState } from 'react';
import { HiChatBubbleLeftRight, HiEnvelope, HiMapPin, HiPaperAirplane } from 'react-icons/hi2';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidEmail, normalizeEmail } from '@/lib/validateEmail';

const WHATSAPP_NUMBER = '5531995617797';
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Informe seu nome');
      return;
    }
    if (!isValidEmail(form.email)) {
      toast.error('Email inválido');
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error('Escreva uma mensagem com pelo menos 10 caracteres');
      return;
    }
    setSending(true);
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: normalizeEmail(form.email),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      toast.success('Mensagem enviada! Obrigado pelo contato.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Não foi possível enviar. Tente mais tarde.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-r from-dark via-dark/90 to-accent/30 px-4 py-12 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <div className="relative container mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-4xl font-bold">Contato</h1>
          <p className="text-primary/90">
            Envie uma mensagem pela plataforma ou use os canais abaixo.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Card className="mb-8 overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HiPaperAirplane className="h-6 w-6 text-primary" aria-hidden />
              Enviar mensagem
            </CardTitle>
            <CardDescription>
              Sua mensagem fica registrada para a equipe do Sagasu, que poderá responder pelos
              canais indicados nesta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Nome</Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-subject">Assunto (opcional)</Label>
                <Input
                  id="c-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-msg">Mensagem</Label>
                <textarea
                  id="c-msg"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-dark ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? 'Enviando…' : 'Enviar mensagem'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/25 text-dark">
              <HiChatBubbleLeftRight className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-grow">
              <h2 className="mb-1 text-xl font-bold text-dark">WhatsApp</h2>
              <p className="mb-4 text-dark/80">
                Resposta rápida. Envie dúvida, sugestão ou pedido de apoio.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-fg shadow-md transition-colors hover:opacity-95"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/30 text-dark">
              <HiEnvelope className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark">E-mail</h3>
            <p className="mb-3 text-sm text-dark/80">Parcerias, imprensa ou contato institucional.</p>
            <a
              href="mailto:contato@sagasu.com.br"
              className="font-medium text-primary hover:underline"
            >
              contato@sagasu.com.br
            </a>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/30 text-dark">
              <HiMapPin className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark">Onde estamos</h3>
            <p className="text-sm text-dark/80">
              Projeto no Brasil, apoiando famílias e comunidades em todo o território nacional.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="mx-auto max-w-xl text-sm text-dark/80">
            Em caso de <strong>emergência</strong>, ligue <strong>190</strong> ou <strong>192</strong>
            . O Sagasu complementa com divulgação e rede colaborativa.
          </p>
        </div>
      </div>
    </div>
  );
}
