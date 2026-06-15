# Backend - Gerador de PPCs

API em Node.js, Express e PostgreSQL para autenticacao JWT, recuperacao de senha por e-mail e gerenciamento de PPCs. O backend salva cursos, periodos, disciplinas e pre-requisitos, mantendo cada PPC vinculado ao usuario autenticado.

## Configuracao

1. Crie o banco PostgreSQL `gerador_ppcs`.
2. Copie `.env.example` para `.env`.
3. Ajuste no `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- variaveis SMTP do Mailtrap

4. Instale as dependencias:

```bash
npm install
```

5. Crie as tabelas e o usuario inicial:

```bash
npm run setup
```

6. Inicie a API:

```bash
npm run dev
```

O comando `npm run setup` executa `npm run migrate` e depois `npm run seed`. Use `npm run migrate` ou `npm run seed` separadamente apenas quando quiser aplicar migrations ou criar o usuario inicial de forma isolada.

## Variaveis de Ambiente

O usuario inicial será criado pelo seed com os valores configurados no `.env`:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Esses valores servem apenas para criar o usuario inicial. Quando a senha e alterada pelo fluxo "Esqueci minha senha", o sistema atualiza o campo `password_hash` no banco de dados e nao altera o arquivo `.env`.

Para usar "Esqueci minha senha" com Mailtrap, configure:

- `SMTP_HOST=sandbox.smtp.mailtrap.io`
- `SMTP_PORT=2525`
- `SMTP_USER` com o usuario SMTP exibido pelo Mailtrap
- `SMTP_PASS` com a senha SMTP exibida pelo Mailtrap
- `SMTP_FROM=Gerador de PPCs <no-reply@gerador-ppcs.local>`
- `SMTP_REJECT_UNAUTHORIZED=true`
- `PASSWORD_RESET_BASE_URL=http://127.0.0.1:5500/frontend`

Nao envie o arquivo `.env` para o GitHub.

## Scripts

- `npm run dev`: inicia a API em modo desenvolvimento.
- `npm start`: inicia a API sem watch.
- `npm run migrate`: executa as migrations SQL.
- `npm run seed`: cria o usuario inicial se ele ainda nao existir.
- `npm run setup`: executa migrations e seed em sequencia.

## Docker

Tambem e possivel subir o projeto completo com Docker Compose. Esse fluxo inicia PostgreSQL, backend e frontend estatico:

```bash
docker compose up --build
```

No Docker, o backend executa `npm run setup` automaticamente antes de iniciar a API, entao nao e necessario rodar `npm run setup` manualmente.

Enderecos principais:

- Frontend: `http://localhost:5500/frontend/index.html`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

O PostgreSQL do Docker usa volume persistente. Para zerar os dados do banco, remova tambem o volume do Compose.

Para testar Mailtrap no Docker, defina as variaveis SMTP no ambiente antes de subir o Compose ou ajuste os valores no `docker-compose.yml`.

## Rotas

Rotas de autenticacao:

- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

Rotas de PPC:

- `POST /api/ppc`
- `GET /api/ppc`
- `GET /api/ppc/:id`
- `PUT /api/ppc/:id`
- `DELETE /api/ppc/:id`

As rotas de PPC exigem JWT no header `Authorization`. Cada PPC pertence ao usuario autenticado, entao um usuario nao lista, visualiza, edita ou remove PPCs de outro usuario.

## Migrations

As migrations atuais criam:

- tabela de usuarios;
- tabelas de cursos, periodos, disciplinas e pre-requisitos;
- tabela de tokens de recuperacao de senha;
- vinculo `user_id` em `courses` para associar PPCs ao usuario dono.

## Teste de Recuperacao de Senha

1. Configure as variaveis SMTP do Mailtrap no `.env`.
2. Rode:

```bash
npm run setup
npm run dev
```

3. Na tela de login, clique em `ESQUECI MINHA SENHA`.
4. Informe o e-mail cadastrado.
5. Abra a inbox do Mailtrap.
6. Acesse o link recebido.
7. Informe a nova senha.
8. Teste o login novamente com a nova senha.
