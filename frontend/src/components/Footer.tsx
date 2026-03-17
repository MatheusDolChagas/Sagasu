import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Sagasu</h3>
            <p className="text-background">
              Sistema colaborativo para localização de idosos desaparecidos
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-background">
              <li><Link to="/cases" className="hover:text-primary">Casos</Link></li>
              <li><Link to="/my-cases" className="hover:text-primary">Meus Casos</Link></li>
              <li><Link to="/groups" className="hover:text-primary">Grupos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Ajuda</h4>
            <ul className="space-y-2 text-background">
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contato</Link></li>
              <li><Link to="/about" className="hover:text-primary">Sobre Nós</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <p className="text-background">
              Email: contato@sagasu.com.br
            </p>
          </div>
        </div>
        <div className="border-t border-background mt-8 pt-8 text-center text-background">
          <p>&copy; 2025 Sagasu. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
