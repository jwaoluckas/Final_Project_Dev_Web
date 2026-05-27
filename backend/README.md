# Backend - Gerador de PPCs

API inicial em Node.js, Express e PostgreSQL para autenticacao do usuario do sistema.

## Configuracao

1. Crie o banco PostgreSQL `gerador_ppcs`.
2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
3. Instale as dependencias:

```bash
npm install
```

4. Crie as tabelas e o usuario inicial:

```bash
npm run setup
```

5. Inicie a API:

```bash
npm run dev
```

O usuario inicial sera criado com os valores configurados no seu `.env` local:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Nao envie o arquivo `.env` para o GitHub.

## Rotas

- `POST /api/auth/login`
- `GET /api/auth/me`
