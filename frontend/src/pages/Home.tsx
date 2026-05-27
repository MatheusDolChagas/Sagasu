import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HiBell, HiMap, HiUserGroup } from 'react-icons/hi2';
import { Case } from '../types';
import { useIsAuthenticated, useAuthStore } from '../store/authStore';
import api from '../services/api';
import CaseCard from '../components/CaseCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface CaseWithUser extends Case {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const features = [
  {
    icon: HiUserGroup,
    title: 'Busca colaborativa',
    description:
      'Envolva a comunidade na busca por idosos desaparecidos através de uma rede colaborativa.',
  },
  {
    icon: HiBell,
    title: 'Notificações em tempo real',
    description:
      'Receba atualizações instantâneas sobre dicas e informações relacionadas ao caso.',
  },
  {
    icon: HiMap,
    title: 'Geolocalização',
    description:
      'Visualize casos e avistamentos em um mapa interativo para coordenar a busca.',
  },
] as const;

const steps = [
  { n: 1, title: 'Cadastre o caso', text: 'Registre informações sobre o desaparecido.' },
  { n: 2, title: 'Divulgue', text: 'Compartilhe nas redes e com grupos de voluntários.' },
  { n: 3, title: 'Receba dicas', text: 'A comunidade pode enviar informações seguras.' },
  { n: 4, title: 'Coordene buscas', text: 'Organize grupos e avistamentos no mapa.' },
] as const;

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
        const casesResponse = await api.get('/cases');
        if (casesResponse.data.success) {
          const allCases = casesResponse.data.data.map(mapCase);
          setPopularCases(allCases.slice(0, 3));
        }

        if (isAuthenticated && user) {
          try {
            const myCasesResponse = await api.get('/cases/my/list');
            if (myCasesResponse.data.success && myCasesResponse.data.data.length > 0) {
              const myCases = myCasesResponse.data.data.map(mapCase);
              setLastCase(myCases[0]);
            }
          } catch {
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
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
      <Card className="mb-12 border-border shadow-sm">
        <CardHeader className="space-y-6 pb-8 pt-10 text-center md:pt-12">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">Rede colaborativa</Badge>
            <Badge variant="outline">Idosos desaparecidos</Badge>
          </div>
          <div className="space-y-4">
            <CardTitle className="font-display text-4xl font-bold tracking-tight text-dark md:text-5xl">
              Sagasu
            </CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base text-dark/80 md:text-lg">
              Sistema web colaborativo para apoio à localização de idosos desaparecidos — casos,
              mapa, avistamentos e notificações em um só lugar.
            </CardDescription>
          </div>
          <CardFooter className="flex flex-wrap justify-center gap-3 pb-0 pt-2">
            <Button asChild size="lg">
              <Link to="/cases">Ver casos</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/map">Abrir mapa</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/cases/create">Criar caso</Link>
            </Button>
          </CardFooter>
        </CardHeader>
      </Card>

      <section className="mb-14">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-dark md:text-3xl">
              Por que usar o Sagasu
            </h2>
            <p className="mt-1 text-dark/75">
              Ferramentas pensadas para agilizar buscas e manter todos informados.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-dark ring-1 ring-primary/25">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-dark/75">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Card className="mb-14">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl">Como funciona</CardTitle>
          <CardDescription className="mx-auto max-w-lg">
            Quatro passos para registrar, divulgar e coordenar uma busca com apoio da comunidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-dark ring-2 ring-primary/35">
                  {step.n}
                </div>
                <h4 className="font-semibold text-dark">{step.title}</h4>
                <p className="mt-1 text-sm text-dark/70">{step.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-dark md:text-3xl">
            {isAuthenticated ? 'Meu último caso' : 'Destaques'}
          </h2>
          <Separator className="max-w-[120px] flex-1" />
        </div>
        {isLoading ? (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ) : isAuthenticated && lastCase ? (
          <CaseCard caseItem={lastCase} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Últimas atualizações</CardTitle>
              <CardDescription>
                Fique por dentro dos casos e das ações da comunidade. Explore o mapa e os
                avistamentos para ajudar.
              </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button asChild variant="outline">
                <Link to="/cases">Ver todos os casos</Link>
              </Button>
              <Button asChild variant="ghost" className="text-primary">
                <Link to="/sightings">Avistamentos</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-dark md:text-3xl">
            Casos recentes
          </h2>
          <Separator className="max-w-[120px] flex-1" />
        </div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((k) => (
              <Card key={k}>
                <CardContent className="space-y-3 pt-6">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-9 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : popularCases.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {popularCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-dark/80">Nenhum caso encontrado no momento.</p>
              <Button asChild className="mt-4">
                <Link to="/cases/create">Criar o primeiro caso</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
