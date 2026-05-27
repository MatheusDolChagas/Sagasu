import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import api from '../services/api';

export default function AdminDocsSwagger() {
  const [spec, setSpec] = useState<object | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get('/admin/openapi.json');
        if (!cancelled) setSpec(r.data as object);
      } catch {
        if (!cancelled) {
          setErr(
            'Não foi possível carregar o OpenAPI. Verifique se você está logado como administrador.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-accent text-sm">{err}</p>;
  }
  if (!spec) {
    return <p className="text-muted text-sm py-8">Carregando especificação Swagger…</p>;
  }

  return (
    <div className="swagger-admin-wrap">
      <SwaggerUI
        spec={spec as Record<string, unknown>}
        deepLinking
        docExpansion="list"
        defaultModelsExpandDepth={1}
      />
    </div>
  );
}
