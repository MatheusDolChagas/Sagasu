import { useEffect, useState } from 'react';
import { Case } from '../types';
import api from '../services/api';
import CaseCard from '../components/CaseCard';
import { toast } from 'react-hot-toast';

interface CaseWithUser extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/cases');
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
        toast.error('Erro ao carregar casos. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-dark">Casos de Desaparecimento</h1>
      
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-dark">Carregando casos...</p>
        </div>
      ) : cases.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-dark text-lg">Nenhum caso encontrado no momento.</p>
          <p className="text-dark mt-2">Seja o primeiro a criar um caso!</p>
        </div>
      )}
    </div>
  );
}
