# Sagasu

Sistema Web Colaborativo para Apoio à Localização de Idosos Desaparecidos com Doenças Cognitivas

## 📋 Sobre o Projeto

O Sagasu é uma plataforma web colaborativa desenvolvida para auxiliar na localização de idosos desaparecidos, especialmente aqueles com doenças cognitivas como Alzheimer. O sistema permite que familiares, voluntários, autoridades e a comunidade trabalhem juntos de forma coordenada e eficiente.

## 🎯 Objetivos

- Facilitar o registro e divulgação de casos de desaparecimento
- Permitir que a comunidade envie dicas e informações de forma anônima
- Coordenar grupos de busca e voluntários
- Fornecer notificações em tempo real sobre atualizações dos casos
- Integrar geolocalização para visualização de casos e dicas em mapas

## 🛠️ Tecnologias

### Backend
- **Node.js** com **Express**
- **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **JWT** para autenticação
- **Socket.io** para notificações em tempo real

### Frontend
- **React** com **TypeScript**
- **Vite** como build tool
- **React Router** para navegação
- **Tailwind CSS** para estilização
- **Leaflet** para mapas interativos
- **Zustand** para gerenciamento de estado

## 📁 Estrutura do Projeto

```
Sagasu/
├── backend/          # API REST
│   ├── src/
│   │   ├── routes/   # Rotas da API
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── frontend/         # Aplicação React
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   └── App.tsx
    └── package.json
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ e npm/yarn
- Docker e Docker Compose (para o banco de dados)
- Git

### 1. Iniciar o Banco de Dados (PostgreSQL com Docker)

1. Inicie o PostgreSQL usando Docker Compose:
```bash
docker-compose up -d
```

Isso irá:
- Criar um container PostgreSQL na porta 5432
- Criar automaticamente o banco de dados `sagasu`
- Configurar usuário: `postgres` e senha: `postgres`

2. Verifique se o container está rodando:
```bash
docker-compose ps
```

### 2. Backend

1. Entre na pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

4. A `DATABASE_URL` já está configurada para o Docker:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sagasu?schema=public"
```

5. Execute as migrações do Prisma:
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Inicie o servidor:
```bash
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### Email de confirmação de cadastro

Sem provedor de email, o cadastro é criado mas **nenhum email é enviado**. Em desenvolvimento, a tela de cadastro mostra o link de confirmação na própria página.

Configure **uma** das opções no `backend/.env` e reinicie o servidor:

**Resend (mais simples)** — [resend.com](https://resend.com) → API Keys:

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=Sagasu <onboarding@resend.dev>
FRONTEND_URL=http://localhost:3000
```

**SMTP (Gmail)** — use [senha de app](https://myaccount.google.com/apppasswords):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=Sagasu <seu@gmail.com>
FRONTEND_URL=http://localhost:3000
```

Conta já criada sem email? Use **Reenviar confirmação** no login ou confirme manualmente no banco (`emailVerified = true` no Prisma Studio).

### Perfis de autoridade (POLICE, NGO, ADMIN)

Usuários comuns se cadastram em `/register` com papel `USER`. Para dar acesso de autoridade:

**Opção A — Prisma Studio (recomendado para desenvolvimento)**

```bash
cd backend
npx prisma studio
```

Na tabela `users`, edite o campo `role` para `POLICE`, `NGO` ou `ADMIN`.

**Opção B — SQL direto no PostgreSQL**

```sql
UPDATE users SET role = 'POLICE' WHERE email = 'email@exemplo.gov.br';
-- ou: 'NGO' / 'ADMIN'
```

**Opção C — API (somente usuário já existente com role ADMIN logado)**

```http
POST /api/auth/users/promote-role
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "email": "email@exemplo.gov.br",
  "role": "POLICE"
}
```

Roles válidos: `USER`, `POLICE`, `NGO`, `ADMIN`.

### Validação de imagens (OpenAI)

No `.env` do backend, configure:

```env
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_MODERATION_MODEL=omni-moderation-latest
MEDIA_NSFW_THRESHOLD=0.82
MEDIA_AVATAR_PERSON_THRESHOLD=0.5
MEDIA_AVATAR_RELAXED=true
```

- **Moderação** (`omni-moderation-latest`): bloqueia conteúdo sexual, violento ou impróprio.
- **Visão** (`gpt-4o-mini`): confirma se há pessoa na foto de perfil ou na foto principal do caso (aceita selfies e espelho melhor que modelos antigos).
- Sem `OPENAI_API_KEY` ou com chave inválida: a validação **rejeita** avatar e foto principal (não aceita “no escuro”).
- `MEDIA_AVATAR_RELAXED=true` só se quiser, explicitamente, aceitar avatar só por formato/tamanho quando a IA falhar (não use em produção).
- Após alterar o `.env`, **reinicie** o backend (`pnpm run dev`).

### Comandos Úteis do Docker

- **Parar o banco de dados:**
  ```bash
  docker-compose down
  ```

- **Ver logs do PostgreSQL:**
  ```bash
  docker-compose logs postgres
  ```

- **Reiniciar o banco de dados:**
  ```bash
  docker-compose restart postgres
  ```

- **Remover tudo (incluindo dados):**
  ```bash
  docker-compose down -v
  ```

### Frontend

1. Entre na pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 📝 Funcionalidades Principais

### Requisitos Funcionais Implementados
- [x] Estrutura base do projeto
- [ ] Formulário de envio anônimo de informações
- [ ] Aba de feed de notícias do caso
- [ ] Botão de voluntário individual "Quero ajudar"
- [ ] Lista de casos conforme proximidade
- [ ] Botão de compartilhamento de informação com autoridades
- [ ] Uso de IA para validação de mídia (visão computacional)
- [ ] Sessão com materiais educativos
- [ ] Notificações em tempo real (push)
- [ ] Botão de compartilhamento rápido em redes sociais
- [ ] Aba de postagem de registro de avistamentos
- [ ] Mapa com geolocalização em tempo real
- [ ] Botão de canal de contato direto via chat/WhatsApp
- [ ] Mapa de calor com estatísticas de desaparecimentos por área
- [ ] Aba de cadastro de voluntários/rede de apoio a um grupo de busca

## 👥 Autores

- Leonardo Vieira Martins
- Matheus Henrique de Oliveira Chagas

## 📄 Licença

Este projeto está sob a licença MIT.

## 📚 Referências

Este projeto foi desenvolvido como parte do trabalho de conclusão de curso na Faculdade Cotemig, baseado na documentação completa disponível em: [Documentação do Projeto](https://docs.google.com/document/d/e/2PACX-1vQtb1iug7WVBJ-xXEXmlXSqULomBmtU1zXE5bssd1fgVS3L4i5_WwNanqDhH3P6b87bsYGlh3n3nYZ5/pub)
