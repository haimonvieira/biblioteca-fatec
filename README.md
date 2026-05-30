# Biblioteca Autonoma FATEC

Site publicado: https://biblioteca-fatec.vercel.app/app/biblioteca

## Visao Geral

Projeto de automacao de biblioteca para o Hackathon FTX, focado em permitir que alunos da FATEC/ETEC realizem entradas, emprestimos, devolucoes e reservas de forma autonoma sem a presenca continua de um bibliotecario.

O sistema usa NFC/RFID para identificar alunos e exemplares, controla o acesso por fechadura eletrica, registra sessoes e ocorrencias, e mantem rastreabilidade em Supabase/PostgreSQL.

## Funcionalidades

- Validacao de aluno via NFC/RFID.
- Identificacao de exemplar de livro via RFID/NFC.
- Registro de entrada e saida na biblioteca.
- Criacao de sessao ativa para alunos dentro da biblioteca.
- Registro de emprestimo e devolucao de exemplares.
- Controle de reservas de obras.
- Registro de ocorrencias e emergencias.
- Interface MVC em Node.js, Express e EJS.

## Tecnologias

- Node.js
- Express
- EJS
- Supabase / PostgreSQL
- pg
- dotenv
- Vercel

## Como Rodar Localmente

### 1. Pre-requisitos

- Node.js 22.x ou superior.
- Uma conta/projeto no Supabase.
- A connection string do Supabase Pooler.

Use o pooler IPv4 do Supabase, nao a conexao direta `db.<project>.supabase.co`, se sua rede ou hospedagem nao tiver IPv6.

### 2. Instalar o Projeto

```bash
git clone <url-do-repositorio>
cd Hackathon
npm install
```

### 3. Configurar o `.env`

Crie um arquivo `.env` a partir do `.env.example`:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` com os dados do Supabase:

```env
PORT=3000
DATABASE_URL=postgresql://postgres.xiuxnmgqxnaamckmhqmd:SUA_SENHA@aws-1-us-west-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://xiuxnmgqxnaamckmhqmd.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

Notas:

- `DATABASE_URL` e usada pelo backend Node para consultar o PostgreSQL.
- `SUPABASE_URL` e as keys sao usadas para integracoes via API HTTPS.
- Nunca suba `.env` para o Git.

### 4. Criar as Tabelas no Supabase

No Supabase Dashboard:

1. Abra o projeto.
2. Entre em **SQL Editor**.
3. Cole o conteudo de `supabase-schema.sql`.
4. Execute o script.

O schema cria tabelas, relacionamentos, RLS e dados iniciais de alunos, livros e exemplares.

### 5. Rodar o Servidor

Para desenvolvimento com reload:

```bash
npm run dev
```

Para rodar sem nodemon:

```bash
npm start
```

Acesse:

```text
http://localhost:3000
```

A rota `/` redireciona para:

```text
http://localhost:3000/app/biblioteca
```

### 6. Dados de Teste

Aluno padrao logado:

```text
ID: 1
NFC/RFID: FATEC-ALUNO-123456
```

Exemplares de teste:

```text
FATEC-BIB-EX-001
FATEC-BIB-EX-002
FATEC-BIB-EX-003
```

Use `FATEC-ALUNO-123456` para testar reservas e emprestimos.

## Deploy na Vercel

O projeto ja possui:

- `api/index.js` para rodar o Express como funcao serverless.
- `vercel.json` para redirecionar as rotas para a API.
- `engines.node` configurado no `package.json`.

### 1. Configurar Variaveis na Vercel

Em `Vercel > Project > Settings > Environment Variables`, cadastre:

```env
DATABASE_URL=postgresql://postgres.xiuxnmgqxnaamckmhqmd:SUA_SENHA@aws-1-us-west-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://xiuxnmgqxnaamckmhqmd.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Publicar

Faca o deploy pela integracao GitHub/Vercel ou pela CLI da Vercel.

Depois de publicar, acesse:

```text
https://biblioteca-fatec.vercel.app/app/biblioteca
```

## Endpoints da API

### Livros

- `GET /livros` - lista todos os livros/obras cadastrados com contagem de exemplares e status.
- `GET /livros/:id` - retorna os detalhes de uma obra especifica.
- `GET /livros/:id/exemplares` - lista os exemplares fisicos de uma obra e seus status.
- `POST /livros/validar-rfid` - valida um exemplar por RFID/NFC.

### NFC / Aluno

- `POST /nfc/aluno/validar` - valida o codigo NFC/RFID do aluno e retorna autorizacao.

### Emprestimos

- `POST /emprestimos/registrar` - registra um emprestimo do aluno para o exemplar.
- `GET /emprestimos/aluno/:aluno_id` - lista emprestimos de um aluno.
- `GET /emprestimos/ativos` - lista emprestimos ativos.

### Devolucoes

- `POST /devolucoes/registrar` - registra a devolucao de um exemplar.

### Acessos

- `POST /acessos/entrada` - valida aluno e registra entrada.
- `POST /acessos/saida` - registra saida e valida condicoes.
- `GET /acessos/sessao/:aluno_id` - verifica se o aluno esta com sessao ativa.
- `GET /acessos/aluno/:aluno_id` - retorna historico de acessos do aluno.
- `POST /acessos/emergencia` - registra emergencia e libera a porta.

### Reservas

- `POST /reservas/criar` - cria reserva temporaria para obra/livro.
- `GET /reservas/aluno/:aluno_id` - lista reservas do aluno.
- `POST /reservas/cancelar` - cancela reserva ativa.

### Ocorrencias

- `GET /ocorrencias` - lista ocorrencias do sistema.
- `GET /ocorrencias/aluno/:aluno_id` - lista ocorrencias de um aluno especifico.

## Estrutura do Projeto

- `server.js` - servidor Express principal e registro de rotas.
- `api/index.js` - entrada serverless para Vercel.
- `routes/` - endpoints HTTP.
- `controllers/` - regras de negocio.
- `models/` - acesso ao banco.
- `config/database.js` - conexao com Supabase/PostgreSQL.
- `views/` - templates EJS.
- `public/` - arquivos estaticos.
- `supabase-schema.sql` - schema e dados iniciais.

## Observacoes

- O aluno logado padrao e o registro de `alunos.id = 1`.
- A rota inicial `/` redireciona para `/app/biblioteca`.
- O projeto esta preparado para expansao com ESP32, leitores NFC/RFID, fechadura eletrica e cameras.
