import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { HiBookOpen, HiCodeBracket, HiComputerDesktop } from 'react-icons/hi2';

const AdminDocsSwagger = lazy(() => import('../components/AdminDocsSwagger'));

type DocTab =
  | 'manual-user'
  | 'manual-police'
  | 'manual-ngo'
  | 'manual-admin'
  | 'tech-api'
  | 'tech-frontend';

const tabs: { id: DocTab; label: string }[] = [
  { id: 'manual-user', label: 'Manual · Usuário' },
  { id: 'manual-police', label: 'Manual · Polícia' },
  { id: 'manual-ngo', label: 'Manual · ONG' },
  { id: 'manual-admin', label: 'Manual · Admin' },
  { id: 'tech-api', label: 'API (Swagger)' },
  { id: 'tech-frontend', label: 'Front-end (técnico)' },
];

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose-manual max-w-none text-dark space-y-4">{children}</div>;
}

export default function AdminDocumentation() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<DocTab>('manual-user');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      toast.error('Acesso restrito a administradores.');
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
          Área restrita
        </p>
        <h1 className="text-3xl font-bold text-dark flex flex-wrap items-center gap-3">
          <HiBookOpen className="w-9 h-9 text-primary shrink-0" aria-hidden />
          Documentação
        </h1>
        <p className="text-dark/75 mt-2 max-w-2xl">
          Manuais por perfil de uso e referência técnica. Visível apenas para administradores.
        </p>
        <Link to="/" className="text-primary text-sm font-semibold mt-3 inline-block hover:underline">
          ← Voltar ao início
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-primary text-primary-fg shadow-sm'
                : 'bg-muted-bg/80 text-dark hover:bg-muted-bg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm min-h-[320px]">
        {tab === 'manual-user' && (
          <Prose>
            <h2 className="text-xl font-bold">Manual do usuário (papel USER)</h2>
            <p>
              Você representa familiar, cuidador ou cidadão que utiliza o Sagasu para divulgar um
              caso ou colaborar com informações.
            </p>
            <h3 className="text-lg font-semibold pt-2">Cadastro e acesso</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Crie sua conta em <strong>Registrar</strong> e faça login.</li>
              <li>No <strong>Perfil</strong>, atualize nome, contato e foto (sujeita a validação automática de mídia).</li>
            </ul>
            <h3 className="text-lg font-semibold pt-2">Abrir um caso</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Em <strong>Criar caso</strong>, preencha título, descrição, nome da pessoa desaparecida e, se possível, último local e data.</li>
              <li>Fotos são enviadas via armazenamento configurado (ex.: Supabase) e validadas pelo servidor.</li>
              <li>Informe o último local visto com endereço claro para facilitar a busca no mapa.</li>
            </ul>
            <h3 className="text-lg font-semibold pt-2">Colaboração</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Consulte <strong>Casos</strong> e o <strong>Mapa</strong> (marcadores e mapa de calor).</li>
              <li>Registre <strong>Avistamentos</strong> com foto e ponto no mapa em casos ativos.</li>
              <li>Participe de <strong>Grupos</strong> de busca quando convidado ou ao solicitar entrada.</li>
            </ul>
            <h3 className="text-lg font-semibold pt-2">Busca de endereço no mapa</h3>
            <p>
              Ao digitar um endereço, aparecem sugestões restritas ao <strong>Brasil</strong>. Escolha a linha correta (ex.: Praça da Liberdade em Belo Horizonte) antes de ir ao ponto.
            </p>
          </Prose>
        )}

        {tab === 'manual-police' && (
          <Prose>
            <h2 className="text-xl font-bold">Manual da polícia (papel POLICE)</h2>
            <p>
              Perfil destinado a integrantes de órgãos de segurança que acompanham casos e podem usar recursos adicionais.
            </p>
            <h3 className="text-lg font-semibold pt-2">Permissões típicas</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Acesso às mesmas áreas do usuário, mais ferramentas administrativas leves conforme política da instituição.</li>
              <li>Acesso à <strong>caixa de mensagens de contato</strong> (inbox) quando habilitado para papéis de autoridade.</li>
            </ul>
            <h3 className="text-lg font-semibold pt-2">Boas práticas</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Valide informações sensíveis antes de acionar equipes em campo.</li>
              <li>Use exportações ou dados do caso para ofícios, respeitando LGPD e procedimento interno.</li>
              <li>Oriente familiares a manter dados e fotos atualizados na plataforma.</li>
            </ul>
          </Prose>
        )}

        {tab === 'manual-ngo' && (
          <Prose>
            <h2 className="text-xl font-bold">Manual de ONG / terceiro setor (papel NGO)</h2>
            <p>
              Organizações parceiras podem apoiar divulgação, voluntariado e articulação comunitária.
            </p>
            <h3 className="text-lg font-semibold pt-2">Atuação</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Crie ou entre em <strong>Grupos</strong> alinhados às ações da entidade.</li>
              <li>Coordene voluntários nos casos em que atuam (inscrições conforme regras de cada caso).</li>
              <li>Utilize o mapa de calor para priorizar regiões com maior densidade de ocorrências registradas na plataforma.</li>
            </ul>
            <h3 className="text-lg font-semibold pt-2">Comunicação</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Responda contatos institucionais pela inbox, quando o papel tiver acesso.</li>
              <li>Mantenha linguagem respeitosa e evite expor dados desnecessários em redes externas.</li>
            </ul>
          </Prose>
        )}

        {tab === 'manual-admin' && (
          <Prose>
            <h2 className="text-xl font-bold">Manual do administrador (papel ADMIN)</h2>
            <p>
              Responsável pela operação técnica, moderação de alto nível e acesso à documentação exclusiva desta área.
            </p>
            <h3 className="text-lg font-semibold pt-2">Checklist operacional</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Garantir variáveis de ambiente do backend (banco, JWT, CORS, opcional OpenAI para validação de mídia).</li>
              <li>Monitorar logs de API e fila de erros de geocodificação (Nominatim — respeitar política de uso).</li>
              <li>Conceder papéis POLICE, NGO e ADMIN apenas a pessoas autorizadas (via banco ou fluxo interno da equipe).</li>
            </ul>
            <h3 className="text-lg font-semibold pt-2">Documentação técnica</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90">
              <li>Aba <strong>API (Swagger)</strong>: contrato OpenAPI servido em <code className="text-sm bg-muted-bg px-1 rounded">GET /api/admin/openapi.json</code> (somente com token de admin).</li>
              <li>Aba <strong>Front-end</strong>: visão da SPA, proxy e variáveis.</li>
            </ul>
          </Prose>
        )}

        {tab === 'tech-api' && (
          <div>
            <div className="flex items-start gap-3 mb-4 text-dark/90">
              <HiCodeBracket className="w-8 h-8 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <h2 className="text-xl font-bold text-dark">Documentação da API (OpenAPI 3 + Swagger UI)</h2>
                <p className="text-sm mt-1">
                  A especificação é carregada com seu JWT de administrador. Use &quot;Authorize&quot; no Swagger (ícone de cadeado), esquema{' '}
                  <code className="text-xs bg-muted-bg px-1 rounded">bearerAuth</code>, e cole o token igual ao armazenado após o login.
                </p>
              </div>
            </div>
            <Suspense
              fallback={<p className="text-muted text-sm py-6">Carregando interface Swagger…</p>}
            >
              <AdminDocsSwagger />
            </Suspense>
          </div>
        )}

        {tab === 'tech-frontend' && (
          <Prose>
            <div className="flex items-start gap-3 mb-2">
              <HiComputerDesktop className="w-8 h-8 text-primary shrink-0" aria-hidden />
              <h2 className="text-xl font-bold">Documentação técnica do front-end</h2>
            </div>
            <h3 className="text-lg font-semibold">Stack</h3>
            <p>
              React 18, TypeScript, Vite, React Router, Tailwind CSS, Zustand (sessão), Axios (cliente HTTP com interceptor JWT), Leaflet + react-leaflet (mapas), Socket.IO-client (tempo real), Supabase JS (upload de imagens quando configurado).
            </p>
            <h3 className="text-lg font-semibold">Proxy e API</h3>
            <p>
              Em desenvolvimento, o Vite encaminha <code className="text-sm bg-muted-bg px-1 rounded">/api</code> e{' '}
              <code className="text-sm bg-muted-bg px-1 rounded">/socket.io</code> para o backend (veja <code className="text-sm bg-muted-bg px-1 rounded">vite.config.ts</code>).
              O Axios usa <code className="text-sm bg-muted-bg px-1 rounded">baseURL: &apos;/api&apos;</code>.
              O health check da API fica na raiz do servidor Express (ex.: <code className="text-sm bg-muted-bg px-1 rounded">GET /health</code> na porta do backend), fora do prefixo <code className="text-sm bg-muted-bg px-1 rounded">/api</code>.
            </p>
            <h3 className="text-lg font-semibold">Variáveis de ambiente (exemplos)</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90 text-sm">
              <li><code className="bg-muted-bg px-1 rounded">VITE_SUPABASE_URL</code>, <code className="bg-muted-bg px-1 rounded">VITE_SUPABASE_ANON_KEY</code> — uploads.</li>
              <li>Buckets opcionais: casos, avatares, avistamentos (ver <code className="bg-muted-bg px-1 rounded">src/lib/supabase.ts</code>).</li>
            </ul>
            <h3 className="text-lg font-semibold">Estrutura útil</h3>
            <ul className="list-disc pl-5 space-y-1 text-dark/90 text-sm">
              <li><code className="bg-muted-bg px-1 rounded">src/pages</code> — telas; <code className="bg-muted-bg px-1 rounded">src/components</code> — UI compartilhada.</li>
              <li><code className="bg-muted-bg px-1 rounded">src/store/authStore.ts</code> — usuário e token.</li>
              <li><code className="bg-muted-bg px-1 rounded">src/lib/socket.ts</code> — conexão em tempo real.</li>
            </ul>
            <h3 className="text-lg font-semibold">Rotas administrativas</h3>
            <p>
              <code className="text-sm bg-muted-bg px-1 rounded">/admin/docs</code> — esta página (somente ADMIN).{' '}
              <code className="text-sm bg-muted-bg px-1 rounded">/admin/contacts</code> — inbox de contato (ADMIN, POLICE, NGO).
            </p>
          </Prose>
        )}
      </div>
    </div>
  );
}
