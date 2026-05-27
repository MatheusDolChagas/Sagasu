import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import PasswordInput from '@/components/PasswordInput';
import { cn } from '@/lib/utils';
import { isValidEmail, normalizeEmail } from '@/lib/validateEmail';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    emailDispatched: boolean;
    devLink?: string;
    emailError?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'As senhas não coincidem' });
      return;
    }

    if (formData.password.length < 6) {
      setErrors({ password: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    if (!isValidEmail(formData.email)) {
      setErrors({ email: 'Digite um email válido' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: normalizeEmail(formData.email),
        phone: formData.phone || undefined,
        password: formData.password,
      });

      if (response.data.success) {
        const emailDispatched = Boolean(response.data.data?.emailDispatched);
        const devLink = response.data.data?.devVerificationLink as string | undefined;
        toast.success(response.data.message || 'Cadastro criado.');
        setPendingVerification({
          email: normalizeEmail(formData.email),
          emailDispatched,
          devLink,
          emailError: response.data.data?.emailError as string | undefined,
        });
      }
    } catch (error: unknown) {
      console.error('Register error:', error);
      const err = error as { response?: { data?: { errors?: { path: string[]; message: string }[]; message?: string } } };
      if (err.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        err.response.data.errors.forEach((e) => {
          validationErrors[e.path[0]] = e.message;
        });
        setErrors(validationErrors);
      } else {
        toast.error(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (key: string) => cn(errors[key] && 'border-accent ring-accent/30');

  const copyDevLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar — selecione o link manualmente');
    }
  };

  if (pendingVerification) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Confirme seu email</CardTitle>
            <CardDescription>
              {pendingVerification.emailDispatched
                ? `Enviamos um link para ${pendingVerification.email}. Verifique a caixa de entrada e o spam.`
                : pendingVerification.emailError
                  ? `Não foi possível enviar para ${pendingVerification.email}: ${pendingVerification.emailError}`
                  : `O email para ${pendingVerification.email} não foi enviado — verifique RESEND_API_KEY no backend.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingVerification.devLink ? (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-dark">
                <p className="font-semibold mb-2">Link para confirmar a conta:</p>
                <a
                  href={pendingVerification.devLink}
                  className="break-all text-primary font-medium hover:underline"
                >
                  {pendingVerification.devLink}
                </a>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => copyDevLink(pendingVerification.devLink!)}
                >
                  Copiar link
                </Button>
              </div>
            ) : null}
            <p className="text-sm text-dark/80 text-center">
              Depois de confirmar, faça login. Se não recebeu o email, use reenviar confirmação.
            </p>
            <Button type="button" className="w-full" onClick={() => navigate('/login')}>
              Ir para o login
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/resend-verification', { state: { email: pendingVerification.email } })}
            >
              Reenviar confirmação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-3xl">Criar conta</CardTitle>
          <CardDescription>
            Após cadastrar, você receberá um email com link para confirmar a conta antes do primeiro acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={fieldClass('name')}
                required
              />
              {errors.name ? <p className="text-sm text-accent">{errors.name}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={fieldClass('email')}
                required
              />
              {errors.email ? <p className="text-sm text-accent">{errors.email}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={(password) => setFormData({ ...formData, password })}
                className={fieldClass('password')}
                required
                autoComplete="new-password"
              />
              {errors.password ? <p className="text-sm text-accent">{errors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <PasswordInput
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(confirmPassword) =>
                  setFormData({ ...formData, confirmPassword })
                }
                className={fieldClass('confirmPassword')}
                required
                autoComplete="new-password"
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-accent">{errors.confirmPassword}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border bg-muted-bg/40 py-4">
          <p className="text-center text-sm text-dark/85">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
