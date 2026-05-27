import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isValidEmail, normalizeEmail } from '@/lib/validateEmail';

export default function ResendVerification() {
  const location = useLocation();
  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefill);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!isValidEmail(email)) {
      setErrors({ email: 'Digite um email válido' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/resend-verification', {
        email: normalizeEmail(email),
      });
      if (res.data.success) {
        setDone(true);
        const link = res.data.data?.devVerificationLink as string | undefined;
        if (link) setDevLink(link);
        toast.success(res.data.message || 'Se o email existir, você receberá o link.');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Não foi possível enviar. Tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Reenviar confirmação</CardTitle>
          <CardDescription>
            Informe o email da conta para receber outro link (válido por 24 horas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3 text-sm text-dark/90 text-center leading-relaxed">
              <p>
                Se este email estiver cadastrado e ainda não confirmado, enviamos um novo link.
                Verifique a caixa de entrada e o spam.
              </p>
              {devLink ? (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-left text-dark">
                  <p className="font-semibold mb-1">Link de confirmação:</p>
                  <a href={devLink} className="break-all text-primary text-xs hover:underline">
                    {devLink}
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-rv">Email</Label>
                <Input
                  id="email-rv"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(errors.email && 'border-accent ring-accent/30')}
                  required
                />
                {errors.email ? (
                  <p className="text-sm text-accent">{errors.email}</p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar link'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t border-border bg-muted-bg/40 py-4">
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Voltar ao login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
