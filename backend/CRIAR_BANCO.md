# Como Criar o Banco de Dados PostgreSQL

## Passo 1: Iniciar o PostgreSQL

O PostgreSQL precisa estar rodando antes de criar o banco. Siga um dos métodos abaixo:

### Método 1: Via Serviços do Windows
1. Pressione `Win + R` e digite `services.msc`
2. Procure por um serviço chamado "postgresql-x64-16" ou similar
3. Clique com botão direito e selecione "Iniciar"

### Método 2: Via Linha de Comando (como Administrador)
```powershell
# Verificar se o serviço existe
Get-Service | Where-Object { $_.Name -like "*postgres*" }

# Se encontrar, iniciar o serviço (substitua NOME_DO_SERVICO)
Start-Service postgresql-x64-16
```

### Método 3: Iniciar Manualmente
Se o PostgreSQL não estiver configurado como serviço, você pode iniciá-lo manualmente:
```powershell
# Navegue até o diretório do PostgreSQL
cd "C:\Program Files\PostgreSQL\16\bin"

# Inicie o servidor (ajuste o caminho do diretório de dados se necessário)
.\pg_ctl.exe -D "C:\Program Files\PostgreSQL\16\data" start
```

## Passo 2: Verificar se o PostgreSQL está rodando
```powershell
# Testar conexão
psql -U postgres -c "SELECT version();"
```

## Passo 3: Criar o Banco de Dados

### Opção 1: Via psql (Recomendado)
```powershell
# Conectar ao PostgreSQL como superusuário
psql -U postgres

# Dentro do psql, execute:
CREATE DATABASE sagasu;

# Sair do psql
\q
```

### Opção 2: Via linha de comando direta
```powershell
psql -U postgres -c "CREATE DATABASE sagasu;"
```

**Nota:** Se pedir senha, use a senha que você configurou durante a instalação do PostgreSQL.

## Passo 4: Configurar o arquivo .env

Certifique-se de que o arquivo `backend/.env` existe e está configurado corretamente:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/sagasu?schema=public"
```

Substitua `SUA_SENHA` pela senha do usuário postgres.

## Passo 5: Executar as Migrações

Depois que o banco estiver criado e o .env configurado:

```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## Solução de Problemas

### Erro: "Connection refused"
- O PostgreSQL não está rodando. Siga o Passo 1.

### Erro: "password authentication failed"
- Verifique a senha no arquivo `.env`
- Ou altere a senha do usuário postgres:
  ```sql
  ALTER USER postgres WITH PASSWORD 'nova_senha';
  ```

### Erro: "database already exists"
- O banco já existe. Você pode pular a criação ou removê-lo:
  ```sql
  DROP DATABASE sagasu;
  CREATE DATABASE sagasu;
  ```
