import { Link } from 'react-router-dom';
import { Case } from '../types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CaseCardProps {
  caseItem: Case;
}

export default function CaseCard({ caseItem }: CaseCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="pr-2 text-xl leading-snug">{caseItem.title}</CardTitle>
          {caseItem.isVerified ? (
            <Badge className="shrink-0">Verificado</Badge>
          ) : null}
        </div>
        <p className="text-xs text-dark/60">
          {caseItem.status === 'ACTIVE' ? 'Caso em aberto' : 'Atualização do caso'}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-dark/90">{caseItem.description}</p>
        <div className="space-y-2 text-sm text-dark">
          <p>
            <strong>Desaparecido:</strong> {caseItem.missingPersonName}
          </p>
          {caseItem.age ? (
            <p>
              <strong>Idade:</strong> {caseItem.age} anos
            </p>
          ) : null}
          {caseItem.gender ? (
            <p>
              <strong>Gênero:</strong> {caseItem.gender}
            </p>
          ) : null}
          {caseItem.lastSeenLocation ? (
            <p>
              <strong>Último local visto:</strong> {caseItem.lastSeenLocation}
            </p>
          ) : null}
          {caseItem.lastSeenDate ? (
            <p>
              <strong>Data do desaparecimento:</strong> {formatDate(caseItem.lastSeenDate)}
            </p>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted-bg/35 pt-4">
        <span className="text-xs text-dark/60">Criado em: {formatDate(caseItem.createdAt)}</span>
        <Button asChild variant="outline" size="sm">
          <Link to={`/cases/${caseItem.id}`}>
            Ver detalhes
            <span className="text-primary" aria-hidden>
              →
            </span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
