import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Case, Volunteer } from '../types';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import CaseCard from '../components/CaseCard';

interface CaseWithUser extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

type VolunteerWithCase = Volunteer & {
  case: Case;
};

function mapCaseFromApi(caseItem: CaseWithUser): Case {
  return {
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
    closureDetails: caseItem.closureDetails,
    cancellationReason: caseItem.cancellationReason,
    closedAt: caseItem.closedAt,
    createdAt: caseItem.createdAt,
    updatedAt: caseItem.updatedAt,
    userId: caseItem.userId,
  };
}

export default function MyCases() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ownedCases, setOwnedCases] = useState<Case[]>([]);
  const [volunteerRows, setVolunteerRows] = useState<VolunteerWithCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const volunteerCases = useMemo(() => {
    const ownedIds = new Set(ownedCases.map((c) => c.id));
    return volunteerRows.filter((v) => v.case && !ownedIds.has(v.case.id));
  }, [ownedCases, volunteerRows]);

  const approvedVolunteer = useMemo(
    () => volunteerCases.filter((v) => v.status === 'APPROVED'),
    [volunteerCases],
  );

  const pendingVolunteer = useMemo(
    () => volunteerCases.filter((v) => v.status === 'PENDING'),
    [volunteerCases],
  );

  const rejectedVolunteer = useMemo(
    () => volunteerCases.filter((v) => v.status === 'REJECTED'),
    [volunteerCases],
  );

  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para ver seus casos');
      navigate('/login');
      return;
    }

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [casesRes, volunteersRes] = await Promise.all([
          api.get('/cases/my/list'),
          api.get('/volunteers/my'),
        ]);

        if (casesRes.data.success) {
          setOwnedCases(
            (casesRes.data.data as CaseWithUser[]).map(mapCaseFromApi),
          );
        }

        if (volunteersRes.data.success && Array.isArray(volunteersRes.data.data)) {
          setVolunteerRows(
            (volunteersRes.data.data as VolunteerWithCase[]).filter(
              (v): v is VolunteerWithCase => !!v?.case?.id,
            ),
          );
        }
      } catch {
        toast.error('Erro ao carregar seus casos. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const hasOwned = ownedCases.length > 0;
  const hasVolunteer =
    approvedVolunteer.length > 0 ||
    pendingVolunteer.length > 0 ||
    rejectedVolunteer.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark">Meus Casos</h1>
          <p className="text-dark/70 text-sm mt-1">
            Casos que você cadastrou e casos em que você ajuda como voluntário.
          </p>
        </div>
        <Link
          to="/cases/create"
          className="bg-primary text-dark px-6 py-3 rounded-xl hover:opacity-95 font-semibold ring-1 ring-primary/30"
        >
          Criar novo caso
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-dark">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-dark">Casos que cadastrei</h2>
              <p className="text-sm text-dark/70">
                Você é o responsável por estes casos e pode editá-los e finalizá-los.
              </p>
            </div>
            {hasOwned ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedCases.map((caseItem) => (
                  <CaseCard key={caseItem.id} caseItem={caseItem} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center">
                <p className="text-dark text-lg mb-4">Você ainda não criou nenhum caso.</p>
                <Link
                  to="/cases/create"
                  className="inline-block bg-primary text-dark px-6 py-3 rounded-xl hover:opacity-95 font-semibold ring-1 ring-primary/30"
                >
                  Criar primeiro caso
                </Link>
              </div>
            )}
          </section>

          <section className="border-t border-border pt-10">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-dark">Casos em que participo</h2>
              <p className="text-sm text-dark/70">
                Casos de outros responsáveis nos quais você se ofereceu para ajudar. Acesse o
                caso para ver detalhes, enviar dicas ou entrar em grupos de busca.
              </p>
            </div>

            {!hasVolunteer ? (
              <div className="bg-card border border-violet-500/25 rounded-2xl p-6 text-center">
                <p className="text-dark/80 mb-3">
                  Você ainda não é voluntário em nenhum caso.
                </p>
                <Link
                  to="/cases"
                  className="text-primary font-semibold hover:underline"
                >
                  Explorar casos abertos
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {approvedVolunteer.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-200 mb-3">
                      Voluntariado aprovado
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {approvedVolunteer.map((v) => (
                        <CaseCard
                          key={v.id}
                          caseItem={v.case}
                          volunteerStatus="APPROVED"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pendingVolunteer.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">
                      Aguardando aprovação do responsável
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingVolunteer.map((v) => (
                        <CaseCard
                          key={v.id}
                          caseItem={v.case}
                          volunteerStatus="PENDING"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {rejectedVolunteer.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-dark/70 mb-3">
                      Pedidos não aprovados
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                      {rejectedVolunteer.map((v) => (
                        <CaseCard
                          key={v.id}
                          caseItem={v.case}
                          volunteerStatus="REJECTED"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
