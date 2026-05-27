# Roteiro de apresentação — Sagasu (pré-banca / banca)

**Tempo sugerido:** 10–12 minutos de fala + demo + 5–10 min de perguntas  
**Dupla:** Os **dois** participam das **duas etapas** (produto/negócio **e** técnica), alternando falas e complementando um ao outro.

**Regra de ouro:** quem não está com o mouse na demo ainda fala 20–30 segundos (contexto de negócio **ou** detalhe técnico daquela tela). Nunca ficar em silêncio enquanto o colega opera o sistema.

---

## Roteiro cronometrado (~10 min) — os dois em tudo

### Etapa 1 — Problema, valor e demonstração (0:00–5:30)

| Tempo | Quem | Conteúdo |
|-------|------|----------|
| **0:00–0:30** | **A + B** | Abertura **juntos** (uma frase cada): apresentar nomes e uma linha sobre o Sagasu. |
| **0:30–1:15** | **A** | Problema e público: idosos 60+, familiares, voluntários, ONGs, autoridades. Não substitui 190/192. |
| **1:15–1:45** | **B** | Proposta de valor + gancho técnico leve: “centralizamos caso, mapa, dicas, chat e notificações em tempo real”. |
| **1:45–4:45** | **A e B alternando** | Demo na tela — ver tabela abaixo (quem opera / quem narra). |
| **4:45–5:30** | **B** | Um diferencial técnico rápido (Socket.io + validação de imagem). |
| **5:30** | **A** | Ponte: “Agora mostramos **como isso foi construído** — também dividido entre nós dois.” |

#### Demo — quem opera e quem complementa

| # | Tela | Opera | Narra (negócio) | Complementa (técnico) |
|---|------|-------|-----------------|------------------------|
| 1 | Cadastro / login | A | E-mail confirmado antes de usar | B: JWT após login, token no cliente |
| 2 | Criar caso | A | Idade 60+, endereço, foto | B: geocodificação no backend, OpenAI na foto |
| 3 | Detalhe do caso | B | Feed, dica anônima, “Quero ajudar” | A: papel do responsável em aprovar |
| 4 | Compartilhar | B | Redes sociais, legenda copiada | A: alcance para a comunidade |
| 5 | Mapa | A | Visão da busca na cidade | B: marcadores + mapa de calor |
| 6 | Avistamentos | B | Foto + local, só casos ativos | A: qualidade da informação para a família |
| 7 | Grupos / contatos | A | Busca pública vs contato privado | B: `isPrivate`, contato ao aprovar voluntário |
| 8 | Chat | B | Mensagens e não lidas | A: coordenação entre voluntários |
| 9 | Meus casos | A | Criados + voluntariados | B: duas listas na API |
| 10 | Encerrar caso | B | Encontrado / cancelado | A: grupos param, contato permanece |
| 11 | Perfil / a11y | A | Foto de perfil, tema, fonte | B: preferências persistidas, toast no tema escuro |

**Frases prontas na demo (qualquer um pode usar):**
- Negócio: “O responsável mantém controle sobre quem ajuda e quando o caso encerra.”
- Técnico: “Isso dispara evento no Socket.io e grava notificação no PostgreSQL.”

---

### Etapa 2 — Arquitetura, stack e fechamento (5:30–10:00)

| Tempo | Quem | Conteúdo |
|-------|------|----------|
| **5:30–6:15** | **B** | Stack (tabela abaixo) — 2–3 itens; **A** interrompe com 1 frase de **por que** essa escolha (ex.: “React pela produtividade da interface”). |
| **6:15–7:00** | **A** | Modelo de dados em linguagem de negócio: Caso, Dica, Voluntário, Grupo, Avistamento — **B** mostra `schema.prisma` ou diagrama nos mesmos nomes. |
| **7:00–7:45** | **B** | API REST + autenticação (JWT, roles POLICE/NGO/ADMIN). |
| **7:45–8:30** | **A** | Regras que a banca costuma perguntar: LGPD, dica anônima, exportação para autoridades. |
| **8:30–9:15** | **B** | Tempo real (salas `user`/`case`/`group`), notificações, `GroupReadReceipt`. |
| **9:15–9:45** | **A** | Limitações honestas: redes sociais, dependência OpenAI/Resend, testes E2E futuros. |
| **9:45–10:00** | **A + B** | Fechamento **juntos**: trabalhos futuros + “perguntem sobre regra de negócio **ou** implementação — os dois dominam o sistema.” |

#### Stack (slide ou fala — B lidera, A comenta 1 linha por linha)

| Camada | Tecnologia | Comentário de negócio (A) |
|--------|------------|---------------------------|
| Frontend | React, TypeScript, Vite, Tailwind, Leaflet | Interface acessível e mapa para busca |
| Backend | Node.js, Express, Zod | Regras de permissão no servidor |
| Banco | PostgreSQL + Prisma | Histórico do caso e auditoria |
| Auth | JWT + e-mail verificado | Conta confiável |
| Tempo real | Socket.io | Família vê dica na hora |
| Arquivos | Supabase Storage | Fotos com URL validada |
| E-mail | Resend / SMTP | Confirmação de cadastro |
| Imagens | OpenAI moderação + visão | Conteúdo impróprio bloqueado |
| Endereços | Nominatim via backend | Busca de rua no Brasil |

---

## Na hora das perguntas — os dois respondem tudo

Não dividir “só negócio” / “só código”. Combinação sugerida:

| Tipo de pergunta | Quem inicia | Quem complementa |
|------------------|-------------|------------------|
| Problema, ética, LGPD | A | B com 1 frase técnica se couber |
| Regra de negócio (voluntário, grupo, encerrar) | Quem lembrar da regra | O outro confirma com exemplo de tela |
| Stack, banco, socket | B | A traduz para o usuário final |
| “Mostrem no código” | B abre arquivo | A explica **o que** aquela regra protege |
| Limitações / trabalhos futuros | Alternar frases | Ambos concordam com 1 ponto cada |

**Se não souberem na hora:** “Boa pergunta — entre nós dois: [colega], você complementa?” (demonstra domínio conjunto do projeto).

---

## Funcionalidades implementadas (referência rápida)

Use esta lista se a banca perguntar “o que está pronto?”:

- [x] Cadastro com confirmação de e-mail e reenvio de link  
- [x] Login JWT, perfil com foto (validada)  
- [x] CRUD de casos (idade mínima, geocodificação, foto principal)  
- [x] Dicas no caso (anônimas ou identificadas)  
- [x] Voluntários (pendente / aprovado / rejeitado) + contato privado automático ao aprovar  
- [x] Grupos de busca públicos + entrar em grupos disponíveis  
- [x] Chat de grupo em tempo real + não lidas + marcar como lidas  
- [x] Feed do caso e notificações no sino (tempo real)  
- [x] Avistamentos com foto e mapa (lista só casos ativos)  
- [x] Mapa com marcadores e mapa de calor  
- [x] Compartilhamento social (WhatsApp, X, FB/LI com texto copiado, Instagram com prévia)  
- [x] Finalizar caso (encontrado / cancelado)  
- [x] Meus casos (criados + voluntariados)  
- [x] Exportação para autoridades (dono / POLICE / NGO / ADMIN)  
- [x] Materiais educativos, FAQ, contato (formulário + WhatsApp)  
- [x] Acessibilidade: tema claro/escuro/sistema, 3 tamanhos de fonte, contraste alto, menos animação  
- [x] Documentação admin (`/admin/docs`) e mensagens de contato (`/admin/contacts`)  

---

## Perguntas prováveis e como responder

### Projeto, negócio e ética

**1. Por que só idosos 60+?**  
> O escopo do TCC e o perfil de risco (Alzheimer, confusão mental, vulnerabilidade). A plataforma pode evoluir, mas o foco atual é esse público.

**2. O Sagasu substitui a polícia?**  
> Não. É ferramenta de **divulgação e organização comunitária**. Em emergência, sempre 190/192. O export para autoridades **complementa** o trabalho oficial.

**3. Como vocês garantem informação confiável?**  
> O **responsável pelo caso** aprova voluntários; dicas podem ser anônimas mas ficam no histórico do caso; fotos passam por **moderação automática**; casos podem ser marcados como verificados (fluxo administrativo).

**4. O que é dica, avistamento e voluntário?**  
> **Dica:** texto/local sobre o caso. **Avistamento:** registro com **foto + coordenadas**. **Voluntário:** pessoa que pede para ajudar; se aprovada, ganha canal privado com o responsável.

**5. Qual a diferença entre grupo de busca e contato salvo?**  
> **Grupo de busca:** público no caso, vários voluntários coordenam ações; **inativa** quando o caso encerra. **Contato salvo:** privado, criado ao aprovar voluntário; **permanece** após o caso fechar para follow-up.

**6. O que acontece quando o caso é encerrado?**  
> Status `FOUND` ou `CLOSED`, com detalhes/motivo e data. Grupos de busca ficam **inativos**; contatos privados **continuam**; avistamentos de casos fechados saem da listagem pública.

**7. E a LGPD / dados pessoais?**  
> Dados para finalidade de busca; dica anônima sem identificar o autor; exportação restrita; usuário controla perfil; em produção: política de privacidade, retenção e DPO seriam formalizados.

---

### Demonstração e UX

**8. Por que o Facebook só mostra o link?**  
> Limitação da API do Facebook: não aceita mais texto pré-preenchido só por URL. Copiamos a **legenda completa** para o usuário colar (Ctrl+V).

**9. Como funciona o Instagram?**  
> Não há API para criar post externo. Abrimos um **modal** com prévia (foto do caso + legenda), opção de baixar imagem, copiar texto e abrir o app/site.

**10. Por que pedir foto de perfil?**  
> Confiança entre família e voluntários. Lembrete amigável em navegação; upload opcional mas incentivado.

**11. Acessibilidade — o que implementaram?**  
> Tema claro/escuro/sistema; **três escalas de fonte**; contraste alto; redução de movimento; skip link; componentes com foco visível.

---

### Arquitetura e código

**12. Por que frontend e backend separados?**  
> Deploy independente, API reutilizável (futuro app mobile), segurança (segredos e regras no servidor).

**13. Onde está a regra “só o dono fecha o caso”?**  
> `case.controller.ts` — `closeCase` verifica `case.userId === req.userId`.

**14. Como funciona o tempo real?**  
> Socket.io: cliente entra em salas `user:{id}`, `case:{id}`, `group:{id}`. Serviços emitem eventos após criar dica, voluntário, avistamento, mensagem de grupo. Frontend (`NotificationBell`, `CaseFeed`, `GroupDetail`) escuta e atualiza.

**15. Como contam mensagens não lidas?**  
> Tabela `GroupReadReceipt` (`lastReadAt` por usuário/grupo). Contagem de comentários posteriores; endpoint `POST /groups/:id/read`; evento `group:unread` via socket.

**16. Por que Prisma?**  
> Tipagem TypeScript, migrations versionadas, produtividade. SQL gerado e auditável.

**17. Como validam imagens?**  
> `mediaValidation.service.ts`: download da URL, moderação OpenAI, visão para avatar e foto principal do caso. Sem chave válida, rejeita conteúdo sensível.

**18. Por que geocodificar no backend?**  
> Evitar CORS, respeitar política do Nominatim, filtrar Brasil (`countrycodes=br`).

**19. Dono do caso pode ver grupo sem ser membro?**  
> Sim, em grupos privados de contato e para acompanhar o caso — `getGroupById` e socket permitem acesso ao **dono do caso** mesmo fora de `group_members`.

---

### Banco de dados

**20. Relacionamentos principais?**  
> `User` 1—N `Case`; `Case` 1—N `Tip`, `Volunteer`, `Group`, `Sighting`; `Group` 1—N `GroupMember`, `GroupComment`; `Volunteer` único por (userId, caseId).

**21. Campos de encerramento do caso?**  
> `closureDetails`, `cancellationReason`, `closedAt`, `status` (`FOUND` / `CLOSED` / etc.).

**22. Notificações — tipos?**  
> `TIP_RECEIVED`, `VOLUNTEER_JOINED`, `CASE_UPDATE`, `GROUP_MESSAGE`, `CASE_RESOLVED`, `SYSTEM`; opcional `groupId` para abrir o chat.

---

### Deploy, operação e limitações

**23. Como rodar localmente?**  
> Docker PostgreSQL → `prisma migrate` → backend `pnpm dev` (porta configurada no `.env`) → frontend Vite (3000) com proxy `/api` e `/socket.io`.

**24. Variáveis críticas?**  
> `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, e-mail (`RESEND_*` ou `SMTP_*`), `OPENAI_API_KEY`, Supabase no frontend (`VITE_SUPABASE_*`).

**25. O que falta para produção?**  
> HTTPS, secrets em cofre, rate limit, logs/monitoramento, testes E2E, backup, política de privacidade publicada, DNS e domínio de e-mail verificado.

**26. E se a OpenAI cair?**  
> Upload de avatar/foto principal falha com mensagem clara; não aceita bypass silencioso em produção (`MEDIA_AVATAR_RELAXED` só para dev explícito).

**27. Como promovem POLICE/ADMIN?**  
> Prisma Studio, SQL ou `POST /api/auth/users/promote-role` (requer ADMIN logado).

---

### Pegadinhas e honestidade acadêmica

**28. Usaram IA para programar?**  
> Ferramentas de apoio podem ter sido usadas; **requisitos, arquitetura, modelagem e integrações foram definidos pela equipe**; código revisado, testado manualmente e documentado.

**29. Qual a maior limitação técnica hoje?**  
> Dependência de serviços externos; ausência de testes automatizados amplos; compartilhamento social limitado pelas redes; notificações via web socket (não push nativo mobile).

**30. Por que Socket.io e não só polling?**  
> Menor latência para dicas, chat e sino de notificações; melhor experiência em busca colaborativa onde minutos importam.

---

## Respostas curtas (uma frase) — cola rápida

| Pergunta | Resposta em 1 frase |
|----------|---------------------|
| Público-alvo? | Familiares, voluntários, ONGs e autoridades em buscas de idosos 60+. |
| Anonimato? | Dicas podem ser anônimas; identidade do autor não é exibida ao público. |
| Tempo real? | Socket.io para feed, chat, membros e notificações. |
| Grupo vs contato? | Grupo = busca pública; contato = privado após aprovar voluntário. |
| Caso fechado? | Grupos de busca desativam; contatos e histórico permanecem. |
| Mapa? | Casos/dicas/avistamentos com coordenadas + mapa de calor. |
| Segurança? | JWT, bcrypt, Zod, roles, validação de mídia. |
| Produção? | Falta endurecer infra, testes e compliance formal LGPD. |

---

## Checklist antes da apresentação

- [ ] Banco com 2–3 casos de teste (BH ou cidade conhecida), com foto e coordenadas  
- [ ] Um caso **ativo** e um **encerrado** (para mostrar diferença em grupos e avistamentos)  
- [ ] Dois usuários logados (responsável + voluntário) para demo de chat e notificação  
- [ ] E-mail configurado OU roteiro para mostrar link de confirmação em dev  
- [ ] Backend + frontend rodando; login testado  
- [ ] Mapa com pelo menos um marcador  
- [ ] Ensaiar demo em **8–9 min** (cronômetro)  
- [ ] Saber abrir `prisma/schema.prisma` e explicar Case, Volunteer, Group em 1 min  
- [ ] Tema escuro ligado se apresentar em projetor (contraste das badges do caso)  

---

## Ensaio recomendado (30 min)

1. **Passagem 1:** A opera demo, B complementa técnico (15 min).  
2. **Passagem 2:** B opera demo, A complementa negócio (15 min).  
3. **Etapa 2:** cada um ensaia 2 min de stack + 2 min de arquitetura (os dois sabem o slide).  
4. Simular 3 perguntas: cada um responde **uma** iniciando e **uma** só complementando o colega.

---

*Documento atualizado: roteiro com participação **paritária** em produto e técnica; funcionalidades alinhadas ao sistema atual (grupos, chat, encerramento, compartilhamento, meus casos, acessibilidade).*
