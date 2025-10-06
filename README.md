# Planeja-AI

## 📋 Objetivo do Projeto

O **Planeja-AI** é uma aplicação Full-Stack de gerenciamento de tarefas (To-Do List) moderna e inteligente, desenvolvida para auxiliar usuários no planejamento e organização de suas atividades diárias. O sistema permite criar, organizar e acompanhar tarefas de forma eficiente, com recursos de análise e visualização de produtividade.

---

## 🚀 Tecnologias Utilizadas

### **Back-end**

- **Node.js** com **TypeScript**: Runtime e linguagem para desenvolvimento do servidor
- **Express.js**: Framework web para criação de APIs RESTful
- **Supabase (PostgreSQL)**: Banco de dados relacional para persistência de dados
- **JWT (JSON Web Tokens)**: Sistema de autenticação e autorização
- **Express Validator**: Validação de dados de entrada

### **Front-end**

- **Next.js 15**: Framework React com renderização no servidor (SSR) e otimizações
- **React 19**: Biblioteca para construção de interfaces de usuário
- **TypeScript**: Linguagem tipada para maior segurança no desenvolvimento
- **Tailwind CSS**: Framework CSS utilitário para estilização
- **Radix UI**: Biblioteca de componentes acessíveis e customizáveis
- **Shadcn/ui**: Componentes de interface baseados em Radix UI
- **Lucide React**: Biblioteca de ícones
- **Date-fns**: Manipulação de datas e horários

### **Banco de Dados**

- **PostgreSQL** (via **Supabase**): Banco de dados relacional com suporte a consultas complexas
- Estrutura com tabelas: `users`, `to_do_plan`, `to_do_list`, `to_do_item`, `steps`
- Relacionamentos entre usuários, planos, listas e tarefas

### **Criptografia**

- **bcryptjs**: Hashing de senhas com salt para armazenamento seguro
- **JWT (jsonwebtoken)**: Tokens criptografados para autenticação stateless
- **Helmet.js**: Proteção contra vulnerabilidades web comuns

### **Containerização**

- **Docker**: Containerização de aplicações (frontend e backend)
- **Docker Compose**: Orquestração de múltiplos containers
- **Nginx**: Servidor web e reverse proxy para roteamento de requisições
- **Certificados SSL/TLS**: Comunicação segura via HTTPS

### **Inteligência Artificial**

- **Integração preparada**: Arquitetura pronta para incorporação de modelos de IA
- **Sugestões inteligentes**: Potencial para análise e recomendação de tarefas
- **Análise de produtividade**: Recursos de analytics para insights do usuário

### **Arquitetura da Aplicação**

- **Arquitetura em Camadas** (Layered Architecture):
  - **Camada de Apresentação**: Frontend Next.js
  - **Camada de API**: Backend Express.js com rotas RESTful
  - **Camada de Lógica de Negócio**: Controllers e Services
  - **Camada de Dados**: Supabase/PostgreSQL
- **Padrão MVC** (Model-View-Controller) no backend
- **Microserviços Containerizados**: Separação clara entre frontend, backend e proxy reverso
- **API RESTful**: Comunicação via endpoints HTTP padronizados
- **Autenticação baseada em JWT**: Stateless authentication
- **Middleware Pipeline**: Validação, autenticação e tratamento de erros
- **CORS** configurado para comunicação segura entre domínios

---

## 👥 Equipe de Desenvolvimento

| Nome               | Responsabilidade |
| ------------------ | ---------------- |
| **Thales**         | Backend          |
| **Gabriel Stordi** | Frontend         |
| **Luis**           | Frontend         |
| **José Eduardo**   | Documentação     |
| **Gabriel Davi**   | DevOps           |
| **Diego**          | Documentação     |
| **Maria Fernanda** | UI/UX            |

---

## 📦 Estrutura do Projeto

```
Planeja-AI/
├── backend/              # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/       # Configurações (Supabase, env)
│   │   ├── controllers/  # Lógica de negócio
│   │   ├── middleware/   # Autenticação e validação
│   │   ├── routes/       # Rotas da API
│   │   └── types/        # Tipos TypeScript
│   ├── database/         # Scripts SQL
│   └── Dockerfile        # Container do backend
├── frontend/planeja-ai/  # Aplicação Next.js
│   ├── app/              # Pages e layouts (App Router)
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários e configs
│   └── Dockerfile        # Container do frontend
├── infra/                # Infraestrutura
│   ├── nginx/            # Configuração do proxy reverso
│   └── certificates/     # Certificados SSL
├── database/             # Modelagem e scripts do BD
└── docker-compose.yml    # Orquestração de containers
```

---

## 🔧 Como Executar o Projeto

### Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js 20+** (para desenvolvimento local)
- Conta no **Supabase** com banco de dados PostgreSQL configurado

### Passos

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/memento-marcio-org/Planeja-AI.git
   cd Planeja-AI
   ```

2. **Configure as variáveis de ambiente:**

   - Crie um arquivo `.env` no diretório `backend/` com:
     ```
     SUPABASE_URL=sua_url_supabase
     SUPABASE_KEY=sua_chave_supabase
     JWT_SECRET=seu_segredo_jwt
     PORT=3001
     ```

3. **Execute o banco de dados:**

   - Execute os scripts SQL em `database/script.sql` no seu projeto Supabase

4. **Inicie os containers:**

   ```bash
   docker-compose up --build
   ```

5. **Acesse a aplicação:**
   - Frontend: `https://localhost` (HTTPS)
   - Backend API: `http://localhost:3001`

---

## 📚 Documentação da API

### Endpoints principais:

#### **Autenticação**

- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login e geração de token JWT

#### **Listas**

- `GET /api/lists` - Listar todas as listas do usuário
- `POST /api/lists` - Criar nova lista
- `DELETE /api/lists/:id` - Deletar lista

#### **Tarefas**

- `GET /api/tasks/:listId` - Listar tarefas de uma lista
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Deletar tarefa

---

## 🎯 Objetivo da Documentação (José Eduardo)

Como responsável pela **Documentação** do projeto, minha contribuição foca em:

### **1. Documentação Técnica Completa**

- Criação e manutenção do README principal do projeto
- Documentação da arquitetura e decisões técnicas
- Diagramas de fluxo e estrutura de dados
- Guias de instalação e configuração

### **2. Documentação da API**

- Especificação detalhada de todos os endpoints
- Exemplos de requisições e respostas
- Códigos de status HTTP e tratamento de erros
- Schemas de validação de dados

### **3. Guias para Desenvolvedores**

- Boas práticas de contribuição ao projeto
- Padrões de código e convenções de nomenclatura
- Fluxo de trabalho com Git e GitHub
- Instruções para setup do ambiente de desenvolvimento

### **4. Documentação de Infraestrutura**

- Configuração do Docker e Docker Compose
- Setup do Nginx e certificados SSL
- Variáveis de ambiente necessárias
- Troubleshooting de problemas comuns

### **5. Integração com o Projeto Final**

Minha documentação garante que:

- Todos os membros do grupo entendam a estrutura do projeto
- Novos desenvolvedores possam configurar o ambiente rapidamente
- A API seja consumida corretamente pelo frontend
- A infraestrutura seja replicável em diferentes ambientes
- O projeto tenha material de referência profissional para apresentação

A documentação serve como ponte entre todas as áreas (Backend, Frontend, DevOps, UI/UX), facilitando a integração e colaboração da equipe.

---

## 📄 Licença

Este projeto foi desenvolvido como trabalho acadêmico e é de uso educacional.

---

## 🔗 Links Úteis

- [Repositório da Organização](https://github.com/memento-marcio-org/Planeja-AI)
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
