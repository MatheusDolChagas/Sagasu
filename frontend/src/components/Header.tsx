import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import NotificationBell from "./NotificationBell";
import AccessibilityMenu from "./AccessibilityMenu";
import AccessibilityControls from "./AccessibilityControls";
import { disconnectSocket } from "../lib/socket";

const AUTHORITY_ROLES = new Set(["ADMIN", "POLICE", "NGO"]);
const ADMIN_ONLY = "ADMIN";

export default function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  const showInbox = user && AUTHORITY_ROLES.has(user.role);
  const showAdminDocs = user?.role === ADMIN_ONLY;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 text-dark shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Sagasu
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-6">
              <Link to="/cases" className="font-medium text-dark/85 hover:text-primary">
                Casos
              </Link>
              <Link to="/map" className="font-medium text-dark/85 hover:text-primary">
                Mapa
              </Link>
              <Link to="/sightings" className="font-medium text-dark/85 hover:text-primary">
                Avistamentos
              </Link>
              {user && (
                <Link to="/my-cases" className="font-medium text-dark/85 hover:text-primary">
                  Meus Casos
                </Link>
              )}
              <Link to="/groups" className="font-medium text-dark/85 hover:text-primary">
                Grupos
              </Link>
              <Link to="/faq" className="font-medium text-dark/85 hover:text-primary">
                FAQ
              </Link>
              <Link to="/materiais" className="font-medium text-dark/85 hover:text-primary">
                Materiais
              </Link>
              <Link to="/about" className="font-medium text-dark/85 hover:text-primary">
                Sobre
              </Link>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-fg ring-1 ring-primary/30 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-semibold text-dark">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    {showInbox ? (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/contacts" className="cursor-pointer">
                          Mensagens de contato
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    {showAdminDocs ? (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/docs" className="cursor-pointer">
                          Documentação
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Acessibilidade
                    </DropdownMenuLabel>
                    <div className="px-2 pb-2">
                      <AccessibilityControls compact />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
                    >
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AccessibilityMenu />
                <Button asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            {user ? <NotificationBell /> : <AccessibilityMenu />}
            <button
              type="button"
              className="p-1 text-dark"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mt-4 space-y-2 md:hidden">
            <Link
              to="/cases"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Casos
            </Link>
            <Link
              to="/map"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Mapa
            </Link>
            <Link
              to="/sightings"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Avistamentos
            </Link>
            {user && (
              <Link
                to="/my-cases"
                className="block py-2 font-medium text-dark/85 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Meus Casos
              </Link>
            )}
            <Link
              to="/groups"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Grupos
            </Link>
            <Link
              to="/faq"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              to="/materiais"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Materiais
            </Link>
            <Link
              to="/about"
              className="block py-2 font-medium text-dark/85 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </Link>
            {user ? (
              <>
                <div className="py-2 text-dark">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="block py-2 font-medium text-dark/85 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Perfil
                </Link>
                {showInbox ? (
                  <Link
                    to="/admin/contacts"
                    className="block py-2 font-medium text-dark/85 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mensagens de contato
                  </Link>
                ) : null}
                {showAdminDocs ? (
                  <Link
                    to="/admin/docs"
                    className="block py-2 font-medium text-dark/85 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Documentação
                  </Link>
                ) : null}
                <div className="rounded-xl border border-border bg-muted-bg/30 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Acessibilidade
                  </p>
                  <AccessibilityControls compact />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-accent-fg hover:opacity-95"
                >
                  Sair
                </button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
