# Planejamento de Sprints — Sagasu

Sistema Web Colaborativo para Apoio à Localização de Idosos Desaparecidos com Doenças Cognitivas.

**Premissa:** Nenhuma entrega foi apresentada ainda. As sprints foram organizadas para que cada data tenha um conjunto demonstrável e a última seja dedicada à documentação para apresentação.

---

## Visão geral das datas

| Sprint | Data        | Foco principal                          |
|--------|-------------|-----------------------------------------|
| 1      | 04/03/2026  | Primeira apresentação + base do sistema |
| 2      | 18/03/2026  | Dicas anônimas e voluntariado           |
| 3      | 01/04/2026  | Mapa e avistamentos                     |
| 4      | 15/04/2026  | Notificações e compartilhamento         |
| 5      | 29/04/2026  | IA, materiais educativos e mapa de calor |
| 6      | 13/05/2026  | **Apresentação da documentação**        |

---

## Sprint 1 — 04/03/2026  
### Primeira apresentação e base do sistema

**Objetivo:** Apresentar o projeto pela primeira vez com visão geral, estrutura e fluxos básicos funcionando.

**Entregas:**

- [ ] **Apresentação do projeto**
  - Objetivo do Sagasu, público-alvo, contexto (idosos com doenças cognitivas).
- [ ] **Estrutura técnica**
  - Stack (Node/Express, React/Vite, Prisma/PostgreSQL), arquitetura backend/frontend.
- [ ] **Autenticação**
  - Registro e login de usuários (já implementado).
  - Perfil básico (já implementado).
- [ ] **Casos de desaparecimento**
  - Listagem de casos ativos.
  - Visualização de detalhes de um caso.
  - Criação de caso (usuário autenticado).
  - “Meus casos” (casos criados pelo usuário).
- [ ] **Navegação e páginas estáticas**
  - Home, Sobre, Contato, FAQ (já existentes).
- [ ] **Documentação mínima**
  - README atualizado, como rodar o projeto (Docker, backend, frontend).

**Critério de aceite:** Demonstração ao vivo de registro, login, listagem de casos, detalhe de caso e criação de caso.

---

## Sprint 2 — 18/03/2026  
### Dicas anônimas e voluntariado

**Objetivo:** Permitir que a comunidade envie informações (dicas) e se cadastre como voluntária; organizar grupos de busca.

**Entregas:**

- [ ] **Formulário de envio anônimo de informações (dicas)**
  - Envio de dica vinculada a um caso (com opção anônima).
  - Campos: texto, local (opcional), mídia (opcional).
  - Backend: rotas e controller de Tips; persistência no banco.
- [ ] **Exibição de dicas no caso**
  - Aba ou seção “Dicas” na página de detalhe do caso (listagem das dicas do caso).
- [ ] **Botão “Quero ajudar” (voluntário individual)**
  - Na página do caso: botão para se inscrever como voluntário.
  - Backend: rotas de volunteers (inscrição, listagem por caso).
  - Status: pendente/aprovado/rejeitado (fluxo básico).
- [ ] **Grupos de busca e rede de apoio**
  - Aba/cadastro de voluntários e grupos de busca por caso.
  - Criar grupo vinculado a um caso, adicionar membros, listar “meus grupos”.
  - Backend: completar CRUD de grupos e membros (já existe parte da estrutura).
- [ ] **Lista de casos por proximidade (opcional nesta sprint)**
  - Ordenar casos por distância (lat/long do usuário ou da última localização do caso), se os dados de localização estiverem disponíveis.

**Critério de aceite:** Envio de dica anônima em um caso, inscrição como voluntário e criação/participação em grupo de busca, com tudo persistido e exibido no frontend.

---

## Sprint 3 — 01/04/2026  
### Mapa e avistamentos

**Objetivo:** Visualização em mapa e registro de avistamentos com localização.

**Entregas:**

- [ ] **Mapa com geolocalização**
  - Integração Leaflet no frontend.
  - Exibir casos no mapa (pin por caso com última localização conhecida).
  - Opcional: exibir dicas com coordenadas no mapa.
- [ ] **Aba de registro de avistamentos**
  - Postagem de avistamento (como dica com localização).
  - Captura de coordenadas (clique no mapa ou geolocalização do navegador).
  - Upload simples de foto no avistamento (sem IA ainda).
- [ ] **Botão “Compartilhar com autoridades”**
  - Exportar/encaminhar resumo do caso e dicas para autoridades (ex.: PDF, link ou e-mail pré-preenchido).
- [ ] **Ajustes de UX no caso**
  - Aba “Avistamentos” ou unificar com “Dicas” filtrando por tipo/avistamento.

**Critério de aceite:** Ver casos no mapa, registrar um avistamento com local e foto, e gerar compartilhamento para autoridades.

---

## Sprint 4 — 15/04/2026  
### Notificações e compartilhamento

**Objetivo:** Notificações em tempo real, compartilhamento em redes sociais e canal de contato direto.

**Entregas:**

- [ ] **Notificações em tempo real**
  - Socket.io no backend; cliente no frontend.
  - Notificar: nova dica no caso, voluntário inscrito, atualização de status do caso.
  - Centro de notificações (sino) na interface e marcar como lido.
- [ ] **Feed de notícias/atualizações do caso**
  - Aba “Feed” ou “Atualizações” no detalhe do caso: linha do tempo com dicas, avistamentos, mudanças de status, voluntários aprovados.
- [ ] **Compartilhamento em redes sociais**
  - Botão “Compartilhar” com opções: WhatsApp, Facebook, Twitter/X, copiar link.
  - Uso de Web Share API quando disponível + fallback (link e texto para copiar).
- [ ] **Canal de contato direto**
  - Botão/link para contato (ex.: WhatsApp do responsável pelo caso ou número configurável).
  - Página de caso: exibir “Falar no WhatsApp” com link `https://wa.me/...`.

**Critério de aceite:** Receber notificação em tempo real ao chegar uma dica; compartilhar caso em rede social e abrir WhatsApp com número do caso.

---

## Sprint 5 — 29/04/2026  
### IA, materiais educativos e mapa de calor

**Objetivo:** Validação de mídia com IA, área educativa e visualização de estatísticas no mapa.

**Entregas:**

- [ ] **Validação de mídia com IA (visão computacional)**
  - Serviço (backend) para análise de fotos de dicas/avistamentos (ex.: detecção de pessoa/rosto, consistência com o caso).
  - Integração com API de visão (ex.: OpenAI Vision, Google Cloud Vision ou similar).
  - Marcar mídia como “verificada por IA” ou sinalizar para revisão humana.
- [ ] **Sessão de materiais educativos**
  - Nova página ou seção “Materiais educativos”: conteúdo sobre Alzheimer, cuidados, o que fazer em desaparecimento, etc.
  - Conteúdo pode ser estático (markdown ou páginas) ou vindo de CMS/backend.
- [ ] **Mapa de calor**
  - Mapa com heatmap de desaparecimentos por região (agregação por área geográfica).
  - Dados baseados nos casos com `lastSeenLocation` ou localização das dicas.
- [ ] **Revisão e testes**
  - Ajustes de usabilidade, correção de bugs e testes manuais dos fluxos principais.

**Critério de aceite:** Upload de foto em dica/avistamento processado pela IA; página de materiais educativos acessível; mapa de calor exibindo regiões com mais casos.

---

## Sprint 6 — 13/05/2026  
### Apresentação da documentação

**Objetivo:** Entregar documentação completa para apresentação (TCC).

**Entregas:**

- [ ] **Documentação técnica**
  - Arquitetura do sistema (diagramas).
  - Modelo de dados (ER ou descrição das entidades Prisma).
  - APIs principais (endpoints, autenticação, exemplos).
  - Instruções de deploy e ambiente.
- [ ] **Documentação de usuário**
  - Manual ou guia: como se registrar, criar caso, enviar dica, ser voluntário, usar mapa e notificações.
- [ ] **Documentação do projeto (TCC)**
  - Revisão e alinhamento com o documento do Google Docs (referência no README).
  - Justificativa, objetivos, metodologia, resultados e conclusões.
- [ ] **Apresentação**
  - Slides e roteiro para demonstração na data 13/05/2026.

**Critério de aceite:** Documentação técnica e de usuário revisadas; material de apresentação pronto para a data definida.

---

## Resumo por sprint

| Sprint | Data        | Entregas principais                                                                 |
|--------|-------------|--------------------------------------------------------------------------------------|
| 1      | 04/03/2026  | Apresentação inicial, auth, casos (listar/detalhe/criar/meus), páginas estáticas     |
| 2      | 18/03/2026  | Dicas anônimas, “Quero ajudar”, grupos de busca, casos por proximidade (opcional)   |
| 3      | 01/04/2026  | Mapa (Leaflet), avistamentos com local, compartilhar com autoridades                 |
| 4      | 15/04/2026  | Notificações em tempo real, feed do caso, share redes sociais, WhatsApp              |
| 5      | 29/04/2026  | IA para mídia, materiais educativos, mapa de calor, revisão e testes                 |
| 6      | 13/05/2026  | Documentação técnica, manual de usuário, documentação TCC e apresentação             |

---

## Observações

- O que **já existe** no código (auth, casos, grupos parciais, páginas) deve ser consolidado e demonstrado na **Sprint 1**.
- As sprints 2–5 assumem dependências em ordem: dicas/voluntários → mapa/avistamentos → notificações/share → IA e materiais.
- A data **13/05/2026** é reservada exclusivamente para **apresentação da documentação**, sem desenvolvimento novo de funcionalidade.
- Ajuste o escopo (incluir/remover itens) conforme a carga do curso e o tempo disponível entre as datas.

Se quiser, posso detalhar uma sprint específica em tarefas técnicas (backend/frontend) ou em formato de backlog (histórias de usuário).
