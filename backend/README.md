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

### Databases (Híbrido SQL + NoSQL)
- **PostgreSQL (Supabase)** - Dados estruturados (usuários, listas, tarefas)
- **MongoDB** - Arquivos e metadados de anexos
- **Filesystem** - Armazenamento físico de uploads

### Backend Core
- **Node.js v18+** - Runtime JavaScript
- **TypeScript** - Tipagem estática e desenvolvimento seguro
- **Express.js** - Framework web minimalista e flexível
- **JWT** - Tokens seguros para autenticação
- **bcryptjs** - Hash seguro de senhas
- **express-validator** - Validação robusta de dados

### File Handling & Storage
- **Multer** - Upload de arquivos multipart/form-data
- **Sharp** - Processamento e otimização de imagens
- **MongoDB Driver** - Cliente oficial para operações NoSQL

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

### 📎 Endpoints de Anexos (MongoDB)

```bash
# Upload de arquivos (até 10 por vez)
POST /api/v1/tasks/:taskId/attachments

# Listar anexos de uma task
GET /api/v1/tasks/:taskId/attachments

# Deletar anexo específico
DELETE /api/v1/tasks/:taskId/attachments/:attachmentId

# Definir como capa da task
PUT /api/v1/tasks/:taskId/attachments/:attachmentId/set-cover

# Servir arquivo original
GET /api/v1/attachments/:taskId/:filename

# Servir thumbnail
GET /api/v1/attachments/:taskId/thumb/:filename
```

**📖 Documentação Completa de Anexos**: [MONGODB_ATTACHMENTS.md](./MONGODB_ATTACHMENTS.md)

## 🎨 Diferencial da Implementação Backend

Esta implementação se destaca por:

1. **Arquitetura Híbrida SQL + NoSQL**: PostgreSQL para dados estruturados + MongoDB para arquivos
2. **Arquitetura em Camadas**: Separação clara entre rotas, controllers, models e middleware
3. **Type Safety**: TypeScript em 100% do código para maior segurança
4. **Validação Rigorosa**: Validação de entrada em todos os endpoints
5. **Segurança Robusta**: JWT + bcrypt + middleware de proteção + validação de mimetype
6. **Código Limpo**: Estrutura organizadas e fácil manutenção
7. **Performance**: Queries otimizadas, thumbnails automáticos, índices MongoDB
8. **Graceful Degradation**: Sistema funciona mesmo sem MongoDB (anexos opcionais)

## 🔧 Como Executar o Backend

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar MongoDB (para anexos)

**✅ MongoDB Atlas Cloud (JÁ CONFIGURADO)**

O projeto já está configurado com MongoDB Atlas cloud! Nenhuma instalação local necessária.

**Alternativas locais:**

```bash
# Docker
docker run -d --name planeja-mongodb -p 27017:27017 mongo:latest

# Ubuntu/Debian
sudo apt install mongodb
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

Adicione no `.env`:
```env
# PostgreSQL
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_key

# MongoDB Atlas (já configurado)
MONGODB_URI=mongodb+srv://leticiacristina21352_db_user:UgOCTDcMLJib8018@cluster0.bnvlisb.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=planeja_ai
```

### 4. Executar

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

### 5. Testar API de Anexos

```bash
# Script de teste automatizado
./test-attachments.sh
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