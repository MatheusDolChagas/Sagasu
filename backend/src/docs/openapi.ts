/**
 * Especificação OpenAPI 3.0 da API Sagasu (servida apenas para ADMIN).
 * Atualize ao adicionar rotas relevantes.
 */
export function getOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Sagasu API',
      description:
        'API do sistema colaborativo para apoio à localização de idosos desaparecidos. ' +
        'Em desenvolvimento, use a mesma origem do frontend com proxy `/api` ou a URL direta do servidor.',
      version: '1.0.0',
    },
    servers: [
      { url: '/', description: 'Origem atual (ex.: proxy Vite em /api)' },
    ],
    tags: [
      { name: 'Auth', description: 'Registro, login e perfil' },
      { name: 'Cases', description: 'Casos de desaparecimento' },
      { name: 'Map', description: 'Mapa, calor e geocodificação (Nominatim, Brasil)' },
      { name: 'Sightings', description: 'Avistamentos' },
      { name: 'Groups', description: 'Grupos de busca' },
      { name: 'Tips', description: 'Dicas sobre casos' },
      { name: 'Volunteers', description: 'Voluntários em casos' },
      { name: 'Notifications', description: 'Notificações do usuário' },
      { name: 'Contact', description: 'Formulário de contato / caixa de entrada' },
      { name: 'Media', description: 'Validação de imagens' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            password: { type: 'string', minLength: 6 },
          },
        },
        CreateCaseBody: {
          type: 'object',
          required: ['title', 'description', 'missingPersonName'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            missingPersonName: { type: 'string' },
            age: { type: 'integer' },
            gender: { type: 'string' },
            lastSeenLocation: { type: 'string' },
            lastSeenLatitude: { type: 'number' },
            lastSeenLongitude: { type: 'number' },
            lastSeenDate: { type: 'string', format: 'date-time' },
            photoUrl: { type: 'string', format: 'uri' },
          },
        },
        CreateSightingBody: {
          type: 'object',
          required: ['caseId', 'latitude', 'longitude', 'photoUrl'],
          properties: {
            caseId: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            photoUrl: { type: 'string', format: 'uri' },
          },
        },
        ValidateMediaBody: {
          type: 'object',
          required: ['imageUrl'],
          properties: {
            imageUrl: { type: 'string', format: 'uri' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar usuário',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
          },
          responses: {
            '201': { description: 'Criado' },
            '400': { description: 'Validação' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
          },
          responses: {
            '200': { description: 'Token JWT em data.token' },
            '401': { description: 'Credenciais inválidas' },
          },
        },
      },
      '/api/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Atualizar perfil',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    avatarUrl: { type: 'string', format: 'uri' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'OK' }, '401': { description: 'Não autenticado' } },
        },
      },
      '/api/cases': {
        get: {
          tags: ['Cases'],
          summary: 'Listar casos',
          responses: { '200': { description: 'Lista de casos' } },
        },
        post: {
          tags: ['Cases'],
          summary: 'Criar caso',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateCaseBody' } },
            },
          },
          responses: { '201': { description: 'Criado' }, '401': { description: 'Não autenticado' } },
        },
      },
      '/api/cases/my/list': {
        get: {
          tags: ['Cases'],
          summary: 'Meus casos',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/cases/{id}': {
        get: {
          tags: ['Cases'],
          summary: 'Detalhe do caso',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { description: 'OK' }, '404': { description: 'Não encontrado' } },
        },
        put: {
          tags: ['Cases'],
          summary: 'Atualizar caso',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/map/markers': {
        get: {
          tags: ['Map'],
          summary: 'Marcadores (casos ativos com coords, dicas, avistamentos)',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/map/heatmap': {
        get: {
          tags: ['Map'],
          summary: 'Agregação para mapa de calor',
          responses: { '200': { description: 'Células com contagens' } },
        },
      },
      '/api/map/geocode': {
        get: {
          tags: ['Map'],
          summary: 'Geocodificar (1º resultado, somente Brasil)',
          parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Coordenadas ou vazio' } },
        },
      },
      '/api/map/geocode/suggest': {
        get: {
          tags: ['Map'],
          summary: 'Sugestões de endereço (até 8, somente Brasil)',
          parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Lista de sugestões' } },
        },
      },
      '/api/sightings': {
        get: {
          tags: ['Sightings'],
          summary: 'Listar avistamentos',
          responses: { '200': { description: 'OK' } },
        },
        post: {
          tags: ['Sightings'],
          summary: 'Registrar avistamento',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateSightingBody' } },
            },
          },
          responses: { '201': { description: 'Criado' } },
        },
      },
      '/api/media/validate': {
        post: {
          tags: ['Media'],
          summary: 'Validar imagem por URL (após upload)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ValidateMediaBody' } },
            },
          },
          responses: { '200': { description: 'Aceita' }, '400': { description: 'Recusada' } },
        },
      },
      '/api/groups': {
        get: {
          tags: ['Groups'],
          summary: 'Listar grupos',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/tips': {
        get: {
          tags: ['Tips'],
          summary: 'Listar dicas (conforme implementação)',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Minhas notificações',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/contact': {
        post: {
          tags: ['Contact'],
          summary: 'Enviar mensagem de contato',
          responses: { '201': { description: 'Enviado' } },
        },
      },
      '/api/contact/inbox': {
        get: {
          tags: ['Contact'],
          summary: 'Caixa de entrada (papéis autorizados)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/admin/openapi.json': {
        get: {
          tags: ['Auth'],
          summary: 'Esta especificação OpenAPI (somente ADMIN)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Documento OpenAPI' } },
        },
      },
    },
  };
}
