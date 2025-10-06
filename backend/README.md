# Planeja-AI Backend - API RESTful

## 📋 Descrição do Backend

Este é o **backend da aplicação Planeja-AI**, uma API RESTful robusta desenvolvida em Node.js com TypeScript para gerenciamento de tarefas e listas de afazeres. O backend fornece toda a infraestrutura de dados e lógica de negócio necessária para suportar a aplicação web.

## 🎯 Objetivo do Código-fonte Backend

Este código-fonte implementa a **camada de servidor completa** do sistema Planeja-AI, servindo como o núcleo da aplicação que:

### 🔧 Funcionalidades da API:

- **Sistema de Autenticação JWT**
  - Registro e login de usuários com validação
  - Tokens JWT seguros para sessões
  - Middleware de autenticação para proteção de rotas

- **API de Gerenciamento de Listas**
  - `POST /api/v1/lists` - Criação de listas
  - `GET /api/v1/lists` - Listagem das listas do usuário
  - `GET /api/v1/lists/:id` - Detalhes de lista específica
  - `DELETE /api/v1/lists/:id` - Exclusão de listas

- **API de Gerenciamento de Tarefas**
  - `POST /api/v1/lists/:id/items` - Criação de tarefas
  - `GET /api/v1/tasks` - Listagem de todas as tarefas
  - `GET /api/v1/tasks/pending` - Tarefas pendentes
  - `GET /api/v1/tasks/completed` - Tarefas concluídas
  - `PUT /api/v1/tasks/:id/complete` - Marcar como concluída

- **Infraestrutura do Servidor**
  - Integração com PostgreSQL via Supabase
  - Validação rigorosa de dados de entrada
  - Tratamento de erros padronizado
  - Logs estruturados e health checks

## 🏗️ Como o Backend se Integra no Projeto Final

### Papel Central no Projeto em Grupo:

Como **API backend**, este código serve como a **base fundamental** para toda a aplicação:

#### 1. **Provedor de Dados para Frontend**
- APIs RESTful prontas para consumo via HTTP
- Respostas JSON padronizadas e consistentes
- Headers CORS configurados para comunicação
- 15 endpoints organizados por funcionalidade

#### 2. **Camada de Segurança**
- Autenticação JWT protegendo recursos sensíveis
- Validação de entrada em todos os endpoints
- Middleware de segurança (Helmet, Rate Limiting)
- Hash seguro de senhas com bcryptjs

#### 3. **Integração com Banco de Dados**
- Schema PostgreSQL otimizado (3 tabelas principais)
- Queries eficientes via Supabase client
- Relacionamentos bem definidos entre entidades
- Transações para operações críticas

#### 4. **Interface para Outros Componentes**

**Para o Frontend (React/Next.js):**
```javascript
// Exemplo de consumo da API
const response = await fetch('/api/v1/lists', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const { lists } = await response.json();
```

**Para Deploy/DevOps:**
- Aplicação configurada via variáveis de ambiente
- Health check endpoint: `GET /health`
- Logs estruturados para monitoramento
- Pronto para containerização Docker

## 🚀 Stack Tecnológica do Backend

- **Node.js v18+** - Runtime JavaScript
- **TypeScript** - Tipagem estática e desenvolvimento seguro
- **Express.js** - Framework web minimalista e flexível
- **Supabase** - PostgreSQL como serviço + autenticação
- **JWT** - Tokens seguros para autenticação
- **bcryptjs** - Hash seguro de senhas
- **express-validator** - Validação robusta de dados

## 📁 Arquitetura do Backend

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts         # Configuração do banco
│   ├── controllers/
│   │   ├── authController.ts   # Lógica de autenticação
│   │   ├── listController.ts   # Lógica de listas
│   │   └── taskController.ts   # Lógica de tarefas
│   ├── middleware/
│   │   ├── auth.ts            # Middleware JWT
│   │   └── validation.ts      # Validadores
│   ├── routes/
│   │   ├── api.ts            # Roteador principal
│   │   ├── auth.ts           # Rotas de autenticação
│   │   ├── lists.ts          # Rotas de listas
│   │   └── tasks.ts          # Rotas de tarefas
│   └── types/
│       └── index.ts          # Tipos TypeScript
├── database/
│   └── schema.sql            # Schema PostgreSQL
└── server.ts                 # Entry point
```

## 🔗 Principais Endpoints da API

### 🔐 Autenticação
```http
POST /api/v1/auth/register    # Registro de usuário
POST /api/v1/auth/login       # Login de usuário
GET  /api/v1/auth/me          # Perfil do usuário
```

### 📝 Listas
```http
GET    /api/v1/lists          # Listar listas do usuário
POST   /api/v1/lists          # Criar nova lista
GET    /api/v1/lists/:id      # Obter lista específica
DELETE /api/v1/lists/:id      # Deletar lista
```

### ✅ Tarefas
```http
POST /api/v1/lists/:id/items     # Criar tarefa na lista
GET  /api/v1/tasks               # Listar todas as tarefas
GET  /api/v1/tasks/pending       # Tarefas pendentes
GET  /api/v1/tasks/completed     # Tarefas concluídas
PUT  /api/v1/tasks/:id/complete  # Marcar como concluída
DELETE /api/v1/tasks/:id         # Deletar tarefa
```

## 🎨 Diferencial da Implementação Backend

Esta implementação se destaca por:

1. **Arquitetura em Camadas**: Separação clara entre rotas, controllers e middleware
2. **Type Safety**: TypeScript em 100% do código para maior segurança
3. **Validação Rigorosa**: Validação de entrada em todos os endpoints
4. **Segurança Robusta**: JWT + bcrypt + middleware de proteção
5. **Código Limpo**: Estrutura organizadas e fácil manutenção
6. **Performance**: Queries otimizadas e estrutura eficiente

## 🔧 Como Executar o Backend

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais Supabase

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## � Monitoramento e Health Check

- **Health Check**: `GET /health` - Status do servidor
- **Logs Estruturados**: Winston para logging profissional
- **Rate Limiting**: Proteção contra abuso de API
- **CORS**: Configurado para comunicação cross-origin

---

**Desenvolvido por:** Thales Vinicius Leal Barcelos 24740
**Papel:** Backend API Developer  
**Tecnologia Principal:** Node.js + TypeScript + Express  
**Data:** Outubro 2025  
**Disciplina:** Desenvolvimento Web 2