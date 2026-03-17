import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, initialize } = useAuthStore();

  useEffect(() => {
    // Inicializar estado de autenticação ao montar o componente
    // O persist do Zustand já faz isso, mas garantimos sincronização
    initialize();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Sagasu
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/cases" className="text-dark hover:text-primary">
              Casos
            </Link>
            {user && (
              <Link to="/my-cases" className="text-dark hover:text-primary">
                Meus Casos
              </Link>
            )}
            <Link to="/groups" className="text-dark hover:text-primary">
              Grupos
            </Link>
            <Link to="/faq" className="text-dark hover:text-primary">
              FAQ
            </Link>
            <Link to="/about" className="text-dark hover:text-primary">
              Sobre
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-dark font-semibold hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-dark">
                      {user.name}
                    </p>
                    <p className="text-xs text-dark opacity-75">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-accent"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="bg-primary text-white px-4 py-2 rounded hover:opacity-90"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-dark"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link
              to="/cases"
              className="block py-2 text-dark hover:text-primary"
            >
              Casos
            </Link>
            {user && (
              <Link
                to="/my-cases"
                className="block py-2 text-dark hover:text-primary"
              >
                Meus Casos
              </Link>
            )}
            <Link
              to="/groups"
              className="block py-2 text-dark hover:text-primary"
            >
              Grupos
            </Link>
            <Link to="/faq" className="block py-2 text-dark hover:text-primary">
              FAQ
            </Link>
            <Link
              to="/about"
              className="block py-2 text-dark hover:text-primary"
            >
              Sobre
            </Link>
            {user ? (
              <>
                <div className="py-2 text-dark">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm opacity-75">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="block py-2 text-dark hover:text-primary"
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-accent text-white px-4 py-2 rounded hover:opacity-90"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block bg-primary text-white px-4 py-2 rounded hover:opacity-90 text-center"
              >
                Entrar
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
