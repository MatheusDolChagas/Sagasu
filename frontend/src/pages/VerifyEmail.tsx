import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token?.trim()) {
      setStatus('err');
      setMessage('Link incompleto. Abra o endereço completo enviado por email.');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const res = await api.get('/auth/verify-email', { params: { token: token.trim() } });
        if (!cancelled && res.data.success) {
          setStatus('ok');
          setMessage(res.data.message || 'Email confirmado.');
        }
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        if (!cancelled) {
          setStatus('err');
          setMessage(msg || 'Não foi possível confirmar. O link pode ter expirado.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Confirmar email</CardTitle>
          <CardDescription>
            Validando seu cadastro no Sagasu…
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-dark/90">
          {status === 'loading' && <p>Aguarde um instante.</p>}
          {status === 'ok' && <p className="text-forest font-medium">{message}</p>}
          {status === 'err' && <p className="text-accent">{message}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-border bg-muted-bg/40 py-4">
          <Button asChild className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
          {status === 'err' ? (
            <Link
              to="/reenviar-confirmacao"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Pedir novo link de confirmação
            </Link>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
