import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Case } from '../types';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import CaseCard from '../components/CaseCard';
import { Link } from 'react-router-dom';

interface CaseWithUser extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function MyCases() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para ver seus casos');
      navigate('/login');
      return;
    }

    const fetchMyCases = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/cases/my/list');
        if (response.data.success) {
          // Mapear os dados da API para o formato esperado
          const mappedCases: Case[] = response.data.data.map((caseItem: CaseWithUser) => ({
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
          }));
          setCases(mappedCases);
        }
      } catch (error: any) {
        console.error('Erro ao buscar casos:', error);
        toast.error('Erro ao carregar seus casos. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCases();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-dark">Meus Casos</h1>
        <Link
          to="/cases/create"
          className="bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 font-semibold"
        >
          Criar Novo Caso
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-dark">Carregando seus casos...</p>
        </div>
      ) : cases.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-dark text-lg mb-4">Você ainda não criou nenhum caso.</p>
          <Link
            to="/cases/create"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 font-semibold"
          >
            Criar Primeiro Caso
          </Link>
        </div>
      )}
    </div>
  );
}
