import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const SKIP_PREFIXES = ['/login', '/register', '/verify-email', '/reenviar-confirmacao', '/profile'];

export default function ProfileAvatarReminder() {
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user || user.avatarUrl) return;
    if (SKIP_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))) {
      return;
    }

    toast(
      (t) => (
        <span
          className="text-sm leading-snug"
          style={{ color: 'var(--app-text)' }}
        >
          Uma foto de perfil ajuda voluntários e famílias a reconhecer quem está na rede.{' '}
          <Link
            to="/profile"
            className="font-semibold text-primary underline-offset-2 hover:underline"
            onClick={() => toast.dismiss(t.id)}
          >
            Adicionar foto
          </Link>
        </span>
      ),
      {
        id: 'profile-avatar-reminder',
        duration: 7000,
        icon: '📷',
        style: {
          background: 'var(--app-surface)',
          color: 'var(--app-text)',
          border: '1px solid var(--app-border)',
        },
      },
    );
  }, [location.pathname, user?.id, user?.avatarUrl]);

  return null;
}
