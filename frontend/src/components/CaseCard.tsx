import { Link } from 'react-router-dom';
import { Case } from '../types';
import { format } from 'date-fns';

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
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-dark flex-1">{caseItem.title}</h3>
        {caseItem.isVerified && (
          <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded">
            Verificado
          </span>
        )}
      </div>
      
      <p className="text-dark mb-4 line-clamp-3">{caseItem.description}</p>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-dark">
          <strong>Desaparecido:</strong> {caseItem.missingPersonName}
        </p>
        {caseItem.age && (
          <p className="text-sm text-dark">
            <strong>Idade:</strong> {caseItem.age} anos
          </p>
        )}
        {caseItem.gender && (
          <p className="text-sm text-dark">
            <strong>Gênero:</strong> {caseItem.gender}
          </p>
        )}
        {caseItem.lastSeenLocation && (
          <p className="text-sm text-dark">
            <strong>Último local visto:</strong> {caseItem.lastSeenLocation}
          </p>
        )}
        {caseItem.lastSeenDate && (
          <p className="text-sm text-dark">
            <strong>Data do desaparecimento:</strong> {formatDate(caseItem.lastSeenDate)}
          </p>
        )}
        <p className="text-xs text-dark opacity-75">
          Criado em: {formatDate(caseItem.createdAt)}
        </p>
      </div>
      
      <Link
        to={`/cases/${caseItem.id}`}
        className="text-primary hover:underline font-semibold inline-block"
      >
        Ver detalhes →
      </Link>
    </div>
  );
}
