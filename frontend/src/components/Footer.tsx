import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted-bg/60 text-dark">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-xl font-bold text-primary">Sagasu</h3>
            <p className="text-sm text-muted">
              Sistema colaborativo para localização de idosos desaparecidos.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Links rápidos
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/cases" className="text-dark hover:text-primary hover:underline">
                  Casos
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-dark hover:text-primary hover:underline">
                  Mapa
                </Link>
              </li>
              <li>
                <Link to="/sightings" className="text-dark hover:text-primary hover:underline">
                  Avistamentos
                </Link>
              </li>
              <li>
                <Link to="/my-cases" className="text-dark hover:text-primary hover:underline">
                  Meus casos
                </Link>
              </li>
              <li>
                <Link to="/groups" className="text-dark hover:text-primary hover:underline">
                  Grupos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Ajuda
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-dark hover:text-primary hover:underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-dark hover:text-primary hover:underline">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/materiais" className="text-dark hover:text-primary hover:underline">
                  Materiais educativos
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-dark hover:text-primary hover:underline">
                  Sobre nós
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Contato
            </h4>
            <p className="text-sm text-muted">Email: contato@sagasu.com.br</p>
          </div>
        </div>
        <Separator className="mt-8 bg-border" />
        <div className="pt-6 text-center text-xs text-muted">
          <p>&copy; 2026 Sagasu. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
