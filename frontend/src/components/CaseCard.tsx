import { Link } from 'react-router-dom';
import { Case } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  /** Quando o card representa um caso em que o usuário é voluntário. */
  volunteerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Em andamento',
  FOUND: 'Pessoa encontrada',
  CLOSED: 'Caso cancelado',
  ARCHIVED: 'Arquivado',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
  FOUND: 'border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-200',
  CLOSED: 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200',
  ARCHIVED: 'border-border bg-muted-bg/50 text-dark',
};

const VOLUNTEER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando aprovação',
  APPROVED: 'Voluntário aprovado',
  REJECTED: 'Pedido não aprovado',
};

const VOLUNTEER_STATUS_BADGE: Record<string, string> = {
  PENDING: 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200',
  APPROVED: 'border-violet-500/40 bg-violet-500/15 text-violet-900 dark:text-violet-200',
  REJECTED: 'border-border bg-muted-bg/50 text-muted',
};

export default function CaseCard({ caseItem, volunteerStatus }: CaseCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isClosed = caseItem.status !== 'ACTIVE';
  const statusLabel = STATUS_LABELS[caseItem.status] ?? caseItem.status;
  const statusBadge = STATUS_BADGE[caseItem.status] ?? STATUS_BADGE.ACTIVE;

  return (
    <Card
      className={`transition-shadow hover:shadow-md flex flex-col h-full ${
        isClosed ? 'border-amber-500/25' : ''
      }`}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="pr-2 text-xl leading-snug">{caseItem.title}</CardTitle>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {volunteerStatus && (
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  VOLUNTEER_STATUS_BADGE[volunteerStatus] ?? VOLUNTEER_STATUS_BADGE.PENDING
                }`}
              >
                {VOLUNTEER_STATUS_LABEL[volunteerStatus] ?? volunteerStatus}
              </span>
            )}
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}
            >
              {statusLabel}
            </span>
            {caseItem.isVerified ? <Badge className="shrink-0">Verificado</Badge> : null}
          </div>
        </div>
        {!isClosed ? (
          <p className="text-xs text-dark/60">Caso em aberto — buscas ativas</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {isClosed && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-sm space-y-2">
            {caseItem.closedAt && (
              <p className="text-xs text-dark/70">
                <strong>Finalizado em:</strong> {formatDate(caseItem.closedAt)}
              </p>
            )}
            {caseItem.status === 'FOUND' && caseItem.closureDetails && (
              <div>
                <p className="text-xs font-semibold text-sky-800 dark:text-sky-200 mb-1">
                  Como foi encontrada
                </p>
                <p className="text-dark/90 text-sm whitespace-pre-wrap line-clamp-4">
                  {caseItem.closureDetails}
                </p>
              </div>
            )}
            {caseItem.status === 'CLOSED' && caseItem.cancellationReason && (
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Motivo do cancelamento
                </p>
                <p className="text-dark/90 text-sm whitespace-pre-wrap line-clamp-4">
                  {caseItem.cancellationReason}
                </p>
              </div>
            )}
          </div>
        )}

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
