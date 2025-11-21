# README Pessoal - Thales Vinicius Leal Barcelos

**RA:** 24740  
**Função:** Líder de Backend, testes automatizados e integrações de plataforma

---

## 📌 Escopo e Responsabilidades

- Planejamento e implementação de toda a stack backend Express/TypeScript (`backend/server.ts`) com foco em segurança, observabilidade e extensibilidade.
- Definição de contratos REST, controllers e serviços que alimentam o frontend Next.js (rotas em `backend/src/routes`).
- Integração completa com Supabase/PostgreSQL, MongoDB Atlas, Redis e LangChain/OpenAI para cumprir o requisito SQL + NoSQL + IA.
- Estruturação da suíte de testes (Vitest + Supertest) para cobrir fluxos críticos de autenticação e IA (`backend/test/**`).
- Preparação de ambiente containerizado, health checks e tarefas automáticas que mantêm o sistema estável em produção.

---

## 🧱 Arquitetura do Backend

- Estruturei `server.ts` com middlewares essenciais: `helmet`, `cors`, `compression`, `express-rate-limit`, `cookie-parser` e logger customizado para garantir segurança, rastreabilidade e suporte a cookies HttpOnly.
- Ativei HTTPS automático sempre que os certificados da infra estiverem montados (`/etc/nginx/certs/...`) e mantive fallback HTTP para desenvolvimento.
- Modelei os módulos de configuração em `src/config/index.ts` para centralizar CORS, secrets, rate limiting, cookies e URLs do frontend.
- Expus endpoints institucionais (`/`, `/ping`, `/health`, `/api/v1`) com payloads ricos em telemetria (uptime, memória e versão) viabilizando observabilidade básica.

---

## 🔐 Autenticação e Autorização

- Implementei o `AuthController` com registro/login usando bcrypt (hash com 12 salt rounds) e geração de JWT (`src/middleware/auth.ts`).
- Criei o fluxo completo de refresh token com rotação, cookie HttpOnly, metadados (IP/User-Agent) e store resiliente (`src/lib/refreshTokenStore.ts`).
- Modelei rotas para listar e revogar refresh tokens, além de logout seguro que limpa cookie com as mesmas flags (`src/routes/auth.ts`).
- Automatizei limpeza de tokens expirados via job `startRefreshTokenCleanup` (`src/jobs/refreshTokenCleanup.ts`) que valida a saúde do Supabase antes de cada execução.

---

## ✅ Domínio de Listas e Tarefas

- Desenvolvi os controllers de listas e tarefas (`src/controllers/listController.ts` e `src/controllers/taskController.ts`) com filtros, paginação, ordenação e validações de ownership.
- Garanti que todas as consultas respeitam o `owner_id` via joins no Supabase, evitando vazamento de dados entre usuários.
- Modelei sumarizações (pendentes x concluídas) e operações de CRUD completo: criação sequencial (`item_order`), atualização parcial, toggle de status e deleção segura.

---

## 🤝 Integrações e Serviços

- Configurei o cliente Supabase (`src/config/supabase.ts`) com fallback seguro e utilitários que inspecionam a estrutura das tabelas.
- Adicionei migrações SQL em `database/migrations/2025-11-12_*` para criar `auth_refresh_tokens` e armazenar metadados usados pelos controllers.
- Encapsulei a inicialização do MongoDB para anexos no bootstrap do servidor, permitindo habilitar/desabilitar o recurso conforme o ambiente (`connectMongoDB` + `initAttachmentModel`).
- Construí o subsistema de chat + IA (`src/services/chatService.ts`, `src/controllers/chatController.ts`) com LangChain/OpenAI, streaming via Socket.IO (`src/lib/realtime.ts`) e armazenamento resiliente (`src/lib/chatStore.ts`).
- Criei o `LangchainAdapter` para permitir fallback local e tool calling seguro (`src/lib/langchainAdapter.ts`), inclusive ações automáticas com Supabase Admin quando explicitamente solicitadas pelo usuário.

---

## 🧪 Testes e Qualidade

- Configurei o Vitest em modo ESM/CommonJS híbrido e o bootstrap `test/setup.ts` para subir o app em porta aleatória durante os testes.
- Escrevi testes de integração com Supertest para fluxos de autenticação (`test/auth-register.spec.ts`, `test/auth-login.spec.ts`, `test/auth-refresh.spec.ts`), validando respostas HTTP e cookies.
- Criei testes unitários para o `AuthController` isolando Supabase e JWT via `vi.mock` (`test/controllers/auth.unit.spec.ts`).
- Cobri o serviço de chat com mocks de LangChain e Socket.IO (`test/services/chat.unit.spec.ts`) garantindo persistência de mensagens e streaming de tokens.
- Padronizei scripts `npm run test`, `npm run lint` e `npm run dev` no `package.json`, além do `tsconfig.json` otimizado para `vitest` e build.

---

## 🛠️ DevOps e Infraestrutura

- Mantive Dockerfile multi-stage (`backend/Dockerfile`) para gerar imagens leves (Node 20 Alpine) com build de TypeScript isolado.
- Integrei o backend ao `docker-compose.yml`, Nginx e certificados TLS da pasta `infra/` garantindo deploy único via proxy reverso.
- Adicionei health check específico (`/health`) utilizado pelo Compose/Nginx para saber quando o container está pronto.
- Documentei variáveis de ambiente (`backend/.env.example`) cobrindo Supabase, MongoDB, Redis, OpenAI e política de cookies.
- Habilitei suporte opcional ao Redis adapter, mas com fallback silencioso para single node - evitando travar o servidor quando o serviço não está presente.


---
**Contato**  
Thales Vinicius Leal Barcelos - RA 24740  
thalesvinicius.leal@gmail.com · [github.com/thalesleall](https://github.com/thalesleall)
