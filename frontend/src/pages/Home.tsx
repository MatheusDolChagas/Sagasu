import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Case } from '../types';
import { useIsAuthenticated, useAuthStore } from '../store/authStore';
import api from '../services/api';
import CaseCard from '../components/CaseCard';

interface CaseWithUser extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const { user } = useAuthStore();
  const [lastCase, setLastCase] = useState<Case | null>(null);
  const [popularCases, setPopularCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapCase = (caseItem: CaseWithUser): Case => ({
    id: caseItem.id,
    title: caseItem.title,
    description: caseItem.description,
    missingPersonName: caseItem.missingPersonName,
    age: caseItem.age,
    gender: caseItem.gender,
    lastSeenLocation: caseItem.lastSeenLocation,
    lastSeenDate: caseItem.lastSeenDate,
    status: caseItem.status,
    isVerified: caseItem.isVerified,
    createdAt: caseItem.createdAt,
    updatedAt: caseItem.updatedAt,
    userId: caseItem.userId,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar casos populares (últimos 3 casos ativos)
        const casesResponse = await api.get('/cases');
        if (casesResponse.data.success) {
          const allCases = casesResponse.data.data.map(mapCase);
          // Pegar os 3 mais recentes
          setPopularCases(allCases.slice(0, 3));
        }

        // Buscar último caso do usuário se estiver logado
        if (isAuthenticated && user) {
          try {
            const myCasesResponse = await api.get('/cases/my/list');
            if (myCasesResponse.data.success && myCasesResponse.data.data.length > 0) {
              // Pegar o caso mais recente
              const myCases = myCasesResponse.data.data.map(mapCase);
              setLastCase(myCases[0]);
            }
          } catch (error) {
            // Se não conseguir buscar casos do usuário, não faz nada
            console.log('Não foi possível buscar casos do usuário');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar casos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold text-dark mb-4">
          Sagasu
        </h1>
        <p className="text-xl text-dark mb-8">
          Sistema Web Colaborativo para Apoio à Localização de Idosos Desaparecidos
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/cases"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            Ver Casos
          </Link>
          <Link
            to="/cases/create"
            className="bg-white text-dark px-6 py-3 rounded-lg hover:bg-opacity-80 border border-dark"
          >
            Criar Caso
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Busca Colaborativa</h3>
          <p className="text-dark">
            Envolva a comunidade na busca por idosos desaparecidos através de uma rede colaborativa.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Notificações em Tempo Real</h3>
          <p className="text-dark">
            Receba atualizações instantâneas sobre dicas e informações relacionadas ao caso.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Geolocalização</h3>
          <p className="text-dark">
            Visualize casos e dicas em um mapa interativo para melhor coordenação da busca.
          </p>
        </div>
      </section>

      <section className="bg-white p-8 rounded-lg mb-16">
        <h2 className="text-2xl font-bold text-center mb-4">Como Funciona</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              1
            </div>
            <h4 className="font-semibold mb-2">Cadastre o Caso</h4>
            <p className="text-sm text-dark">Registre informações sobre o desaparecido</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              2
            </div>
            <h4 className="font-semibold mb-2">Divulgue</h4>
            <p className="text-sm text-dark">Compartilhe nas redes sociais</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              3
            </div>
            <h4 className="font-semibold mb-2">Receba Dicas</h4>
            <p className="text-sm text-dark">A comunidade pode enviar informações</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              4
            </div>
            <h4 className="font-semibold mb-2">Coordene Buscas</h4>
            <p className="text-sm text-dark">Organize grupos de voluntários</p>
          </div>
        </div>
      </section>

      {/* Seção: Meu último Caso / Notícia */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-dark mb-6">
          {isAuthenticated ? 'Meu último Caso' : 'Notícia'}
        </h2>
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-dark">Carregando...</p>
          </div>
        ) : isAuthenticated && lastCase ? (
          <CaseCard caseItem={lastCase} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Últimas Notícias</h3>
            <p className="text-dark">
              Fique por dentro das últimas atualizações sobre casos de desaparecimento e ações da comunidade.
            </p>
            <Link
              to="/cases"
              className="text-primary hover:underline font-semibold mt-4 inline-block"
            >
              Ver todos os casos →
            </Link>
          </div>
        )}
      </section>

      {/* Seção: Casos Populares */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-dark mb-6">Casos Populares</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-dark">Carregando casos...</p>
          </div>
        ) : popularCases.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {popularCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-dark">Nenhum caso encontrado no momento.</p>
          </div>
        )}
      </section>
    </div>
  );
}
