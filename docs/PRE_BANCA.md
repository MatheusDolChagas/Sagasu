# Roteiro de apresentação — Pré-banca Sagasu (10 min)

**Dupla sugerida:** Pessoa A (contexto + produto) · Pessoa B (arquitetura + demo técnica)  
**Tempo total:** ~10 minutos (+ 2–3 min reserva para perguntas rápidas no fim de cada bloco)

---

## Pessoa A — Problema, solução e fluxo do usuário (~5 min)

### 0:00–1:00 | Abertura
- “Somos [nomes]. O **Sagasu** é uma plataforma web colaborativa para apoio à localização de **idosos desaparecidos**, com foco em pessoas com **60 anos ou mais** e, em muitos casos, com **comprometimento cognitivo**.”
- Público-alvo: familiares, voluntários, ONGs e autoridades (polícia).

### 1:00–2:30 | Problema e proposta de valor
- Desaparecimento de idosos exige **divulgação rápida**, **organização de buscas** e **canal seguro para dicas**.
- O Sagasu centraliza: cadastro do caso, mapa, dicas, voluntários, grupos de busca, avistamentos e notificações.
- Diferencial: colaboração em tempo real + mapa + validação de conteúdo sensível (fotos).

### 2:30–4:30 | Demonstração (fluxo principal)
Mostrar na ordem:
1. **Cadastro/login** com confirmação de e-mail.
2. **Criar caso** (idade mínima 60, último local visto com sugestão de endereço, foto).
3. **Detalhe do caso** — dicas, “quero ajudar”, feed.
4. **Mapa** — casos, dicas e avistamentos; mapa de calor.
5. **Grupo de busca** — comentários e chat (se tiverem dados de teste).

### 4:30–5:00 | Encerramento do bloco A
- “O sistema prioriza **privacidade** (coordenadas não expostas na UI pública onde aplicável), **papel de autoridade** (exportação de caso) e **acessibilidade** (controles de tema/tamanho).”
- Passa a palavra para a Pessoa B.

---

## Pessoa B — Arquitetura, stack e decisões técnicas (~5 min)

### 5:00–6:00 | Stack
| Camada | Tecnologia |
|--------|------------|
| Frontend | React, TypeScript, Vite, Tailwind |
| Backend | Node.js, Express, TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Tempo real | Socket.io |
| Arquivos | Supabase Storage |
| E-mail | Resend (domínio `sagasu.com.br`) |
| Validação de imagens | API OpenAI (moderação + visão) |
| Geocodificação | Nominatim + Photon (proxy no backend) |

### 6:00–7:30 | Arquitetura
- API REST em `/api/*` — controllers por domínio (`auth`, `cases`, `tips`, `groups`, `map`, `media`).
- `middleware` de autenticação e autorização por **role** (`USER`, `POLICE`, `NGO`, `ADMIN`).
- Prisma: modelos `User`, `Case`, `Tip`, `Volunteer`, `Group`, `Sighting`, `Notification`, etc.
- Upload: front envia para Supabase → backend valida URL da imagem antes de persistir.

### 7:30–9:00 | Pontos que a banca costuma perguntar (antecipar na fala)
- **Segurança:** senha com hash; JWT; rotas protegidas; validação com Zod.
- **LGPD/privacidade:** dicas podem ser anônimas; exportação para autoridades restrita.
- **Escalabilidade:** stateless na API; filas não implementadas (limitação conhecida).
- **Limitações atuais:** dependência de serviços externos (OpenAI, Resend, OSM); domínio de e-mail precisa DNS verificado.

### 9:00–10:00 | Fechamento
- Próximos passos: app mobile, push notifications, integração formal com órgãos, testes automatizados.
- “Estamos abertos às perguntas sobre código, banco e regras de negócio.”

---

## Perguntas prováveis da banca (preparem respostas)

### Sobre o projeto / negócio
1. Por que foco só em 60+?  
   *Resposta:* Alinhado ao escopo do TCC e ao perfil de risco de idosos com Alzheimer e similares.

2. Como garantem que a informação é confiável?  
   *Resposta:* Dono do caso modera voluntários; dicas têm status; autoridades podem exportar pacote do caso.

3. O que acontece com dados sensíveis (foto, endereço)?  
   *Resposta:* Armazenamento em storage com políticas; validação de imagem; mapa agrega/omite detalhes conforme regras da UI.

4. Diferença entre dica, avistamento e voluntário?  
   *Resposta:* Dica = informação textual; avistamento = registro com local/foto; voluntário = pessoa que se oferece para ajudar no caso.

### Sobre código e arquitetura
5. Por que separaram frontend e backend?  
   *Resposta:* Deploy independente, API reutilizável, segurança (JWT só no client autenticado).

6. Onde está a regra de “só dono edita o caso”?  
   *Resposta:* `case.controller.ts` — checagem `userId` vs `req.userId`.

7. Como funciona o tempo real?  
   *Resposta:* Socket.io no `server.ts` / `socket.ts`; eventos emitidos em `realtime.service.ts` após criar dica/voluntário/avistamento.

8. Por que Prisma e não SQL puro?  
   *Resposta:* Tipagem, migrations versionadas, produtividade; SQL gerado pelo Prisma.

9. Como validam imagens?  
   *Resposta:* `mediaValidation.service.ts` — download da URL, moderação OpenAI, visão para foto de perfil/capa do caso.

10. Por que geocodificação no backend?  
    *Resposta:* Evitar CORS e respeitar política de uso do Nominatim; filtro `countrycodes=br`.

### Sobre banco de dados
11. Qual o relacionamento Case ↔ User?  
    *Resposta:* `Case.userId` → dono; voluntários via tabela `Volunteer`.

12. Como modelaram grupos públicos vs privados?  
    *Resposta:* Campo `isPrivate` em `Group`; listagens filtram por permissão.

13. E-mail verificado está onde?  
    *Resposta:* `User.emailVerified`, token e expiração em colunas de verificação.

### Sobre deploy e operação
14. Como rodam localmente?  
    *Resposta:* Docker PostgreSQL, `pnpm dev` no backend (porta 4445), frontend Vite (3000) com proxy `/api`.

15. Variáveis de ambiente críticas?  
    *Resposta:* `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `OPENAI_API_KEY`, Supabase no front.

16. O que falta para produção?  
    *Resposta:* HTTPS, secrets em vault, rate limit, logs, testes E2E, monitoramento, backup do banco.

### Pegadinhas / críticas
17. “Usaram IA no código?”  
    *Resposta honesta:* Ferramentas de apoio podem ter sido usadas; **arquitetura, regras de negócio e integrações foram definidas pela equipe**; código revisado e testado manualmente.

18. “E se a OpenAI cair?”  
    *Resposta:* Cadastro de imagem pode falhar com mensagem clara; anexos gerais têm fluxo mais simples; fallback configurável.

19. “Como promovem usuário a POLICE/ADMIN?”  
    *Resposta:* Prisma Studio/SQL ou endpoint `POST /api/auth/users/promote-role` (ADMIN).

---

## Checklist antes da pré-banca
- [ ] Banco com 2–3 casos de teste realistas (nomes, fotos, endereços em BH).
- [ ] E-mail/domínio Resend verificado OU link de confirmação manual preparado.
- [ ] Backend e frontend rodando; login testado.
- [ ] Mapa com pelo menos um marcador.
- [ ] Saber abrir `prisma/schema.prisma` e explicar 3 entidades principais.
- [ ] Temporizador: ensaiar 1x cronometrado (8–9 min de fala + demo).

---

## Divisão alternativa (se preferirem por camada)

| Tempo | Pessoa A | Pessoa B |
|-------|----------|----------|
| 0–3 min | Problema + personas | Stack + diagrama |
| 3–7 min | Demo UX (caso + mapa) | Demo código (auth + Prisma + socket) |
| 7–10 min | Acessibilidade + materiais | Segurança + limitações + trabalhos futuros |
