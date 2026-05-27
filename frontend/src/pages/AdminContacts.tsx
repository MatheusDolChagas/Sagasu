import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROLES = new Set(['ADMIN', 'POLICE', 'NGO']);

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: string;
};

export default function AdminContacts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [items, setItems] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!ROLES.has(user.role)) {
      toast.error('Acesso restrito a administradores e autoridades.');
      navigate('/');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/contact/inbox');
        if (!cancelled && res.data.success) {
          setItems(res.data.data);
        }
      } catch {
        if (!cancelled) toast.error('Não foi possível carregar as mensagens.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  if (!user || !ROLES.has(user.role)) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-dark">Mensagens de contato</h1>
          <p className="mt-1 text-sm text-muted">
            Formulário enviado pela página Contato. Perfis ADMIN, POLICE e NGO.
          </p>
        </div>
        <Link
          to="/contact"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Ver página pública
        </Link>
      </div>

      {loading ? (
        <p className="text-dark">Carregando…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Nenhuma mensagem ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {items.map((m) => (
            <li key={m.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-lg">{m.subject || '(sem assunto)'}</CardTitle>
                    <time
                      className="text-xs text-muted"
                      dateTime={m.createdAt}
                    >
                      {format(new Date(m.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </time>
                  </div>
                  <p className="text-sm text-dark">
                    <span className="font-semibold">{m.name}</span>
                    {' · '}
                    <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                      {m.email}
                    </a>
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-dark/90">{m.message}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
