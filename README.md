# Gerador de PPCs

Sistema web para criação, edição, visualização e exportação de PPCs (Projetos Pedagógicos de Curso), desenvolvido como projeto acadêmico do curso de Engenharia de Software do IFPE Campus Belo Jardim.

## Identificação do Projeto

**Instituição:** IFPE Campus Belo Jardim  
**Curso:** Engenharia de Software  
**Disciplinas:** Desenvolvimento Web e Projeto de Software  
**Professores:** Fábio Feliciano e Guilherme Cavalcanti  
**Autores:** João Lucas, Marcelo Augusto e Marcel Gustavo

## Objetivo

O projeto tem como objetivo apoiar a geração e o gerenciamento de PPCs para cursos superiores, com foco inicial na realidade do IFPE Campus Belo Jardim.

A proposta nasceu da necessidade de uma ferramenta mais intuitiva para montar matrizes curriculares, organizar períodos, disciplinas, optativas, pré-requisitos e gerar uma visualização em PDF. A solução busca oferecer uma experiência mais direta, com navegação simples e organização visual inspirada em boas práticas de acessibilidade e nos padrões do Governo Digital.

Referências de design e padronização:

- [Design System Gov.br](https://www.gov.br/ds/home?authuser=2)
- [Ferramentas de Design System do Governo Digital](https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/transformacao-digital/ferramentas/design-system?authuser=2)

## Funcionalidades

- Login com autenticação JWT.
- Recuperação de senha por e-mail usando Nodemailer e Mailtrap.
- Criação de PPCs com nome do curso, natureza e quantidade de períodos.
- Edição das informações principais do curso.
- Cadastro, edição e remoção de disciplinas por período.
- Cadastro de disciplinas optativas em bloco separado.
- Seleção de múltiplos pré-requisitos para uma disciplina.
- Listagem dos PPCs pertencentes ao usuário autenticado.
- Exclusão de PPCs.
- Visualização da matriz curricular.
- Download do PPC em PDF no formato de fluxograma.
- Isolamento dos PPCs por usuário autenticado.
- Navegação básica por teclado com campos, botões, links e seletores HTML nativos.

## Tecnologias Utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript
- jsPDF
- html2canvas
- Nginx para servir os arquivos estáticos no Docker

### Backend

- Node.js
- Express
- PostgreSQL
- JWT
- bcryptjs
- Nodemailer
- pg
- dotenv

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL em container
- Render para publicação da API
- Docker Hub para publicação das imagens

## Arquitetura

O projeto usa uma arquitetura web cliente-servidor. O frontend é estático e consome uma API REST criada com Node.js e Express. O backend se comunica com PostgreSQL e organiza o código em camadas, separando rotas, controladores, serviços, repositórios e acesso ao banco.

```mermaid
flowchart LR
    Usuario[Usuario] --> Frontend[Frontend HTML CSS JS]
    Frontend --> API[Backend Node.js Express]
    API --> Auth[Autenticacao JWT]
    API --> Services[Servicos de negocio]
    Services --> Repositories[Repositorios]
    Repositories --> DB[(PostgreSQL)]
    API --> Mail[Mailtrap / SMTP]
    Frontend --> PDF[Geracao de PDF]
```

### Camadas do Backend

- **Routes:** definem os endpoints da API.
- **Controllers:** recebem as requisições HTTP e retornam respostas.
- **Services:** concentram regras de negócio, validações e transações.
- **Repositories:** executam consultas e comandos no banco.
- **Database:** gerencia conexão, migrations e estrutura do PostgreSQL.
- **Middlewares:** tratam autenticação e erros.

## Estrutura do Projeto

```text
Final_Project_Dev_Web/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── migrations/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── seeds/
│   │   └── services/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── pagina_criando_ppc/
│   ├── pagina_criar_editar_ppcs/
│   ├── pagina_editar_ppc/
│   ├── pagina_visualizar_pdf/
│   ├── Dockerfile
│   ├── index.html
│   ├── script.js
│   └── style.css
├── docker-compose.yml
└── README.md
```

## Documentação e Diagramas

Os diagramas do projeto estão disponíveis em arquivos `.puml` na raiz do repositório para exportação em PNG por ferramentas como PlantUML, VS Code ou draw.io:

- [`arquitetura.puml`](arquitetura.puml): visão geral da arquitetura da aplicação.
- [`requisitos.puml`](requisitos.puml): mapa visual dos requisitos funcionais e não funcionais.
- [`casos_de_uso.puml`](casos_de_uso.puml): diagrama de casos de uso do sistema.
- [`classes.puml`](classes.puml): diagrama de classes conceitual.
- [`fluxo_criacao_ppc.puml`](fluxo_criacao_ppc.puml): diagrama de sequência do fluxo de criação de PPC.

## Banco de Dados

As migrations ficam em `backend/src/migrations`.

| Migration | Finalidade |
| --- | --- |
| `001_create_users.sql` | Cria a tabela de usuários. |
| `002_create_ppc_tables.sql` | Cria tabelas de cursos, períodos, disciplinas e pré-requisitos. |
| `003_create_password_reset_tokens.sql` | Cria tabela para tokens de recuperação de senha. |
| `004_add_user_owner_to_courses.sql` | Vincula cada PPC ao usuário autenticado. |

Tabelas principais:

- `users`
- `courses`
- `periods`
- `disciplines`
- `discipline_prerequisites`
- `password_reset_tokens`

## Rotas da API

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Autentica usuário e retorna JWT. |
| `POST` | `/api/auth/forgot-password` | Solicita link de recuperação de senha. |
| `POST` | `/api/auth/reset-password` | Redefine senha usando token recebido por e-mail. |
| `GET` | `/api/auth/me` | Retorna dados do usuário autenticado. |

### PPC

Todas as rotas de PPC exigem JWT.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/ppc` | Cria um PPC. |
| `GET` | `/api/ppc` | Lista PPCs do usuário autenticado. |
| `GET` | `/api/ppc/:id` | Busca um PPC específico do usuário autenticado. |
| `PUT` | `/api/ppc/:id` | Atualiza um PPC. |
| `DELETE` | `/api/ppc/:id` | Exclui um PPC. |

### Saúde da API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica se o backend está ativo. |

## Como Rodar Localmente

Além deste README geral, o arquivo [`backend/README.md`](backend/README.md) documenta especificamente a configuração do backend, incluindo variáveis de ambiente, migrations, seed, autenticação JWT e recuperação de senha.

### Requisitos

- Git instalado.
- Node.js 20 ou superior.
- PostgreSQL instalado e em execução.
- VS Code com Live Server ou outro servidor estático para o frontend.
- Conta Mailtrap para testar recuperação de senha.

### 1. Clonar o repositório

Abra o terminal na pasta onde deseja salvar o projeto e execute:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd Final_Project_Dev_Web
```

Se você já tiver o projeto clonado, apenas entre na pasta:

```bash
cd caminho/para/Final_Project_Dev_Web
```

### 2. Configurar o banco PostgreSQL

Crie o banco:

```sql
CREATE DATABASE gerador_ppcs;
```

### 3. Configurar variáveis de ambiente

Entre na pasta do backend:

```bash
cd backend
```

Crie o arquivo `.env` com base no exemplo:

```bash
copy .env.example .env
```

As variáveis necessárias estão documentadas em [`backend/.env.example`](backend/.env.example). Copie esse arquivo para `.env` e ajuste os valores conforme seu ambiente local. O arquivo `.env` não deve ser enviado para o GitHub.

### 4. Instalar dependências e preparar backend

```bash
npm install
npm run setup
```

O comando `npm run setup` executa:

```bash
npm run migrate
npm run seed
```

Ou seja, ele cria/atualiza as tabelas e cria o usuário inicial definido por `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

### 5. Iniciar backend

```bash
npm run dev
```

API local:

```text
http://localhost:3000
```

Teste de saude:

```text
http://localhost:3000/health
```

### 6. Iniciar frontend

Abra o projeto com Live Server apontando para:

```text
http://127.0.0.1:5500/frontend/index.html
```

Quando o frontend roda localmente, ele chama:

```text
http://localhost:3000/api
```

Quando roda fora do ambiente local, ele chama:

```text
https://api-gerador-ppcs.onrender.com/api
```

## Como Rodar com Docker Compose

### Requisitos

- Docker Desktop instalado.
- Docker Compose disponível no terminal.

### Subir o projeto completo

Na raiz do projeto, execute:

```bash
docker compose up --build
```

Esse comando sobe tres serviços:

- `db`: PostgreSQL.
- `backend`: API Node.js/Express.
- `frontend`: Nginx servindo os arquivos estáticos.

No Docker, o backend executa automaticamente:

```bash
npm run setup
npm start
```

Portanto, não e necessário rodar migrations ou seed manualmente dentro do container.

### URLs no Docker

Frontend:

```text
http://localhost:5500/frontend/index.html
```

Backend:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

PostgreSQL:

```text
localhost:5432
```

Credenciais padrão do banco no Docker Compose:

```text
Database: gerador_ppcs
User: postgres
Password: postgres
```

### Parar os containers

```bash
docker compose down
```

### Parar e apagar os dados do banco Docker

Use este comando apenas se quiser zerar o banco do Docker:

```bash
docker compose down -v
```

### Recriar as imagens

```bash
docker compose build --no-cache
docker compose up
```

## Imagens Docker Publicadas

As imagens também foram publicadas no Docker Hub.

Backend:

```text
augusto5132/final_project_dev_web-backend:latest
```

Docker Hub:

```text
https://hub.docker.com/repository/docker/augusto5132/final_project_dev_web-backend/general
```

Frontend:

```text
augusto5132/final_project_dev_web-frontend:latest
```

Docker Hub:

```text
https://hub.docker.com/repository/docker/augusto5132/final_project_dev_web-frontend/general
```

Baixar as imagens:

```bash
docker pull augusto5132/final_project_dev_web-backend:latest
docker pull augusto5132/final_project_dev_web-frontend:latest
```

Observação: o `docker-compose.yml` atual constrói as imagens localmente a partir das pastas `backend` e `frontend`. Para usar diretamente as imagens publicadas, substitua o bloco `build` de cada servico por `image` apontando para as imagens acima.

Exemplo conceitual:

```yaml
backend:
  image: augusto5132/final_project_dev_web-backend:latest

frontend:
  image: augusto5132/final_project_dev_web-frontend:latest
```

## Deploy

Aplicação online:

```text
https://gerador-ppcs-web.onrender.com/index.html
```

O backend foi configurado para uso online no Render:

```text
https://api-gerador-ppcs.onrender.com
```

O frontend possui configuração dinâmica da URL da API:

- em ambiente local, usa `http://localhost:3000/api`;
- em ambiente online, usa `https://api-gerador-ppcs.onrender.com/api`.

No Render ou em qualquer outro provedor, configure as variáveis de ambiente do backend seguindo o arquivo [`backend/.env.example`](backend/.env.example).

## Recuperação de Senha

A recuperação de senha usa Mailtrap em ambiente de desenvolvimento.

Fluxo:

1. Usuário solicita recuperação pelo login.
2. Backend gera um token seguro.
3. Apenas o hash do token é salvo no banco.
4. O link é enviado por e-mail via SMTP.
5. Usuário acessa o link e informa nova senha.
6. Backend valida o token e atualiza `password_hash` na tabela `users`.

Alterar a senha pelo fluxo de recuperação não altera o arquivo `.env`. O `.env` define apenas o usuário inicial criado pelo seed.

## Observações de Segurança

- Nunca envie `.env` para o GitHub.
- Troque `JWT_SECRET` em ambiente real.
- Use credenciais SMTP próprias no provedor de deploy.
- Senhas são armazenadas com hash.
- Tokens de recuperação são salvos como hash e possuem expiração.
- Rotas de PPC exigem JWT.
- Cada PPC fica associado ao usuário autenticado.

## Observações sobre Escopo Atual

O sistema já permite criar PPCs, gerenciar disciplinas, optativas, pré-requisitos e gerar PDF. Alguns itens citados durante a elicitação, como turno do curso, validação formal de carga horária total planejada e cadastro público de novos usuários, podem ser tratados como evoluções futuras, pois não fazem parte do comportamento atual implementado.

## Possíveis Evoluções

- Cadastro administrativo de novos usuários.
- Perfis de acesso diferentes para docentes, coordenadores e administradores.
- Validação formal de carga horária obrigatória, optativa e complementar.
- Cadastro de ementas completas.
- Registro de competências por disciplina.
- Histórico de versões de PPC.
- Exportação em outros formatos.
- Adequação visual mais próxima ao Design System Gov.br.
