import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { reconnectSocketWithAuth } from '../lib/socket';
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
import PasswordInput from '@/components/PasswordInput';
import { cn } from '@/lib/utils';
import { isValidEmail, normalizeEmail } from '@/lib/validateEmail';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const st = location.state as { pendingEmailVerification?: boolean } | null;
    if (st?.pendingEmailVerification) {
      toast(
        'Enviamos um link de confirmação para o seu email. Abra-o para ativar a conta antes de entrar.',
        { duration: 6000, icon: '✉️' },
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!isValidEmail(formData.email)) {
      setErrors({ email: 'Digite um email válido' });
      return;
    }
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: normalizeEmail(formData.email),
        password: formData.password,
      });

      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        reconnectSocketWithAuth();

        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { response?: { data?: { errors?: { path: string[]; message: string }[]; message?: string } } };
      if (err.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        err.response.data.errors.forEach((e) => {
          validationErrors[e.path[0]] = e.message;
        });
        setErrors(validationErrors);
      } else {
        toast.error(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-3xl">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar casos e notificações.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(errors.email && 'border-accent ring-accent/30')}
                required
              />
              {errors.email ? (
                <p className="text-sm text-accent">{errors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={(password) => setFormData({ ...formData, password })}
                className={cn(errors.password && 'border-accent ring-accent/30')}
                required
                autoComplete="current-password"
              />
              {errors.password ? (
                <p className="text-sm text-accent">{errors.password}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted-bg/40 py-4">
          <p className="text-center text-sm text-dark/85">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
          <p className="text-center text-sm text-dark/80">
            Não recebeu o link?{' '}
            <Link
              to="/reenviar-confirmacao"
              className="font-semibold text-primary hover:underline"
            >
              Reenviar confirmação
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
