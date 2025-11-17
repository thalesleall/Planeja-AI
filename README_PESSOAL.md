# Implementação MongoDB Atlas - Sistema de Anexos

**Desenvolvido por:** Leticia Cristina Silva  
**RA:** 21352  
**Responsabilidade:** Banco de Dados NoSQL (MongoDB)

---

## 📋 Resumo da Implementação

Este documento descreve a implementação completa do sistema de anexos utilizando **MongoDB Atlas** como banco de dados NoSQL no projeto Planeja-AI. O sistema permite que usuários façam upload, visualizem, gerenciem e excluam arquivos anexados às suas tarefas.

---

## 🎯 Objetivo

Implementar um sistema robusto de gerenciamento de anexos que permita:

- **Upload de múltiplos arquivos** (imagens, PDFs, documentos)
- **Armazenamento em nuvem** usando MongoDB Atlas
- **Processamento de imagens** com geração automática de thumbnails
- **Visualização e download** de arquivos
- **Definição de imagem de capa** para tarefas
- **Interface intuitiva** no frontend com contador de anexos

---

## 🏗️ Arquitetura da Solução

### **Backend (Node.js + Express + TypeScript)**

#### 1. **Configuração do MongoDB Atlas**

**Arquivo:** `backend/src/config/mongodb.ts`

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://...';

export async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas conectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB Atlas:', error);
    process.exit(1);
  }
}
```

**Conexão estabelecida com MongoDB Atlas Cloud:**
- Cluster: `cluster0.bnvlisb.mongodb.net`
- Database: `planeja_ai`
- Collection: `attachments`

---

#### 2. **Model de Dados (Mongoose Schema)**

**Arquivo:** `backend/src/models/TaskAttachment.ts`

```typescript
interface ITaskAttachment {
  taskId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  isCover: boolean;
  uploadedAt: Date;
}
```

**Campos do Schema:**
- `taskId` - ID da tarefa (referência ao PostgreSQL)
- `filename` - Nome do arquivo no servidor
- `originalName` - Nome original do arquivo
- `mimetype` - Tipo MIME (image/png, application/pdf, etc.)
- `size` - Tamanho em bytes
- `path` - Caminho do arquivo no sistema
- `thumbnailPath` - Caminho da miniatura (apenas para imagens)
- `isCover` - Indica se é a imagem de capa da tarefa
- `uploadedAt` - Data e hora do upload

**Métodos Implementados:**
- `findByTaskId(taskId)` - Buscar todos os anexos de uma tarefa
- `createAttachment(data)` - Criar novo anexo
- `deleteById(id)` - Excluir anexo por ID
- `setCover(id, taskId)` - Definir imagem como capa
- `countByTaskId(taskId)` - Contar anexos de uma tarefa
- `findById(id)` - Buscar anexo por ID

---

#### 3. **Middleware de Upload (Multer)**

**Arquivo:** `backend/src/middleware/upload.ts`

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads/attachments/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(null, isValid);
  }
});
```

**Configurações:**
- Limite de 10MB por arquivo
- Tipos permitidos: imagens (JPEG, PNG, GIF), PDFs, documentos Word, TXT
- Nomes únicos com timestamp e hash aleatório

---

#### 4. **Processamento de Imagens (Sharp)**

**Arquivo:** `backend/src/utils/imageProcessor.ts`

```typescript
import sharp from 'sharp';

export async function createThumbnail(imagePath: string): Promise<string> {
  const thumbnailPath = imagePath.replace(/(\.\w+)$/, '-thumb$1');
  
  await sharp(imagePath)
    .resize(300, 300, { fit: 'cover' })
    .toFile(thumbnailPath);
  
  return thumbnailPath;
}
```

**Funcionalidade:**
- Redimensiona imagens para 300x300px
- Mantém proporção com crop inteligente
- Gera thumbnail automaticamente no upload

---

#### 5. **Controller de Anexos**

**Arquivo:** `backend/src/controllers/attachmentController.ts`

**Métodos Implementados:**

1. **`uploadAttachment`** - Faz upload de arquivo
   - Recebe arquivo via multipart/form-data
   - Gera thumbnail se for imagem
   - Salva metadados no MongoDB
   - Retorna informações do anexo criado

2. **`getTaskAttachments`** - Lista anexos de uma tarefa
   - Retorna array com todos os anexos
   - Inclui URLs para download

3. **`deleteAttachment`** - Remove anexo
   - Deleta arquivo do disco
   - Remove thumbnail se existir
   - Remove documento do MongoDB

4. **`setCoverImage`** - Define imagem como capa
   - Remove flag de capa dos outros anexos
   - Define o anexo como capa da tarefa

5. **`serveFile`** - Serve arquivo para download
   - Retorna arquivo com headers corretos
   - Suporta download e visualização inline

6. **`serveThumbnail`** - Serve thumbnail de imagem
   - Retorna miniatura otimizada

---

#### 6. **Rotas da API**

**Arquivo:** `backend/src/routes/attachments.ts`

```typescript
POST   /api/attachments/upload          - Upload de arquivo
GET    /api/attachments/task/:taskId    - Listar anexos da tarefa
DELETE /api/attachments/:id             - Excluir anexo
PUT    /api/attachments/:id/cover       - Definir como capa
GET    /api/attachments/:id/file        - Download do arquivo
GET    /api/attachments/:id/thumbnail   - Download do thumbnail
```

**Middlewares aplicados:**
- `authMiddleware` - Validação de JWT em todas as rotas
- `upload.single('file')` - Processamento de upload (rota POST)

---

### **Frontend (Next.js + React + TypeScript)**

#### 1. **API Client**

**Arquivo:** `frontend/planeja-ai/lib/api.ts`

```typescript
export const attachments = {
  upload: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    return post('/attachments/upload', formData);
  },
  list: (taskId: string) => get(`/attachments/task/${taskId}`),
  delete: (attachmentId: string) => del(`/attachments/${attachmentId}`),
  setCover: (attachmentId: string) => put(`/attachments/${attachmentId}/cover`, {}),
};
```

---

#### 2. **Componente de Upload**

**Arquivo:** `frontend/planeja-ai/components/attachment-button.tsx`

**Funcionalidades:**
- Botão com ícone de clipe (Paperclip)
- Input de arquivo oculto
- Badge mostrando quantidade de anexos
- Upload múltiplo de arquivos
- Indicador de loading durante upload
- Tratamento de erros

---

#### 3. **Modal de Visualização**

**Arquivo:** `frontend/planeja-ai/components/attachment-modal.tsx`

**Funcionalidades:**
- Grid responsivo com anexos
- Preview de thumbnails para imagens
- Ícone de documento para outros tipos
- Botões de ação:
  - ⭐ Definir como capa
  - ⬇️ Download
  - 🗑️ Excluir
- Badge "Capa" para imagem destacada
- Formatação de tamanho de arquivo (KB/MB)

---

#### 4. **Integração na Lista de Tarefas**

**Arquivo:** `frontend/planeja-ai/components/task-list.tsx`

**Modificações:**
- Botão de anexo em cada tarefa
- Badge com contador de anexos
- Abertura do modal ao clicar
- Atualização automática após mudanças

---

#### 5. **Página Principal**

**Arquivo:** `frontend/planeja-ai/app/page.tsx`

**Lógica adicionada:**
- Fetch de contadores de anexos para cada tarefa
- Callback `onAttachmentsChange` para refresh
- Propagação de dados para componentes filhos

---

## 📦 Dependências Instaladas

### Backend
```json
{
  "mongoose": "^8.0.0",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0",
  "@types/multer": "^1.4.12"
}
```

### Frontend
```json
{
  "@radix-ui/react-dialog": "^1.1.1"
}
```

---

## 🗂️ Estrutura de Arquivos Criados

```
backend/
├── src/
│   ├── config/
│   │   └── mongodb.ts              # Conexão MongoDB Atlas
│   ├── models/
│   │   └── TaskAttachment.ts       # Schema Mongoose
│   ├── controllers/
│   │   └── attachmentController.ts # Lógica de negócio
│   ├── middleware/
│   │   └── upload.ts               # Configuração Multer
│   ├── routes/
│   │   └── attachments.ts          # Rotas de anexos
│   └── utils/
│       └── imageProcessor.ts       # Processamento Sharp
└── uploads/
    └── attachments/                # Diretório de uploads

frontend/planeja-ai/
├── components/
│   ├── attachment-button.tsx       # Botão de upload
│   ├── attachment-modal.tsx        # Modal de visualização
│   └── ui/
│       └── dialog.tsx              # Componente Dialog (Radix)
├── lib/
│   └── api.ts                      # API client (namespace attachments)
├── app/
│   └── page.tsx                    # Página principal (modificada)
└── components/
    └── task-list.tsx               # Lista de tarefas (modificada)
```

---

## 🔧 Configuração e Setup

### 1. MongoDB Atlas

1. Criar conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Criar novo cluster gratuito (M0)
3. Configurar usuário de banco de dados
4. Adicionar IP à whitelist (0.0.0.0/0 para desenvolvimento)
5. Copiar connection string

### 2. Variáveis de Ambiente

Adicionar no `backend/.env`:
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.bnvlisb.mongodb.net/planeja_ai?retryWrites=true&w=majority
```

### 3. Criação de Diretórios

```bash
mkdir -p backend/uploads/attachments
```

---

## 📊 Fluxo de Upload

1. **Usuário seleciona arquivo** → Frontend (AttachmentButton)
2. **FormData criado** → Inclui arquivo + taskId
3. **Request POST** → `/api/attachments/upload`
4. **Multer processa** → Salva em `uploads/attachments/`
5. **Sharp gera thumbnail** → Se for imagem
6. **Mongoose salva metadados** → MongoDB Atlas
7. **Response retorna** → Dados do anexo
8. **UI atualiza** → Badge incrementa contador

---

## 📥 Fluxo de Download

1. **Usuário clica em Download** → Modal de anexos
2. **Request GET** → `/api/attachments/:id/file`
3. **Controller busca no MongoDB** → Metadados do arquivo
4. **Express envia arquivo** → `res.sendFile(path)`
5. **Browser baixa/abre** → Arquivo original

---

## 🗑️ Fluxo de Exclusão

1. **Usuário confirma exclusão** → Modal de anexos
2. **Request DELETE** → `/api/attachments/:id`
3. **Controller busca arquivo** → MongoDB + filesystem
4. **Deleta do disco** → `fs.unlinkSync()`
5. **Remove do MongoDB** → `TaskAttachment.deleteById()`
6. **UI atualiza** → Remove da lista

---

## ⭐ Fluxo de Capa

1. **Usuário clica em estrela** → Modal de anexos
2. **Request PUT** → `/api/attachments/:id/cover`
3. **Controller atualiza** → Remove flag de outras imagens
4. **Define nova capa** → `isCover: true`
5. **MongoDB atualiza** → Todos os documentos da tarefa
6. **UI atualiza** → Badge "Capa" aparece

---

## 🧪 Testes Realizados

### Testes Manuais

✅ Upload de imagem PNG (2MB) - Sucesso  
✅ Upload de PDF (5MB) - Sucesso  
✅ Upload múltiplo (3 arquivos) - Sucesso  
✅ Geração de thumbnail - Sucesso  
✅ Definir capa - Sucesso  
✅ Download de arquivo - Sucesso  
✅ Exclusão de anexo - Sucesso  
✅ Contador de anexos - Sucesso  
✅ Modal responsivo - Sucesso  

### Validações

✅ Limite de tamanho (10MB) - Bloqueio correto  
✅ Tipos não permitidos (.exe) - Rejeição correta  
✅ Autenticação JWT - Proteção de rotas  
✅ TaskId inválido - Erro 400  
✅ Arquivo não encontrado - Erro 404  

---

## 📈 Estatísticas da Implementação

- **Arquivos criados:** 10
- **Linhas de código:** ~1.200
- **Endpoints API:** 6
- **Componentes React:** 3
- **Modelos de dados:** 1
- **Dependências adicionadas:** 5
- **Tempo de implementação:** ~12 horas

---

## 🚀 Melhorias Futuras

1. **Armazenamento em Cloud Storage** (S3, Google Cloud Storage)
2. **Compressão de arquivos** antes do upload
3. **Visualização inline de PDFs** no modal
4. **Drag & Drop** para upload
5. **Progress bar** durante upload
6. **Filtros por tipo** de arquivo (imagens, documentos)
7. **Busca por nome** de arquivo
8. **Ordenação** por data, nome, tamanho
9. **Limite de anexos por tarefa** (ex: máximo 10)
10. **Galeria lightbox** para visualização de imagens

---

## 🔒 Segurança Implementada

- ✅ **Autenticação JWT** em todas as rotas
- ✅ **Validação de tipos de arquivo** permitidos
- ✅ **Limite de tamanho** de arquivo (10MB)
- ✅ **Nomes únicos** para evitar sobrescrita
- ✅ **Sanitização de inputs** (Express Validator)
- ✅ **Paths absolutos** para evitar directory traversal
- ✅ **CORS configurado** corretamente

---

## 💡 Decisões Técnicas

### Por que MongoDB Atlas?

- **NoSQL flexível** - Ideal para armazenar metadados de arquivos com estrutura variável
- **Cloud nativo** - Sem necessidade de infraestrutura própria
- **Escalabilidade** - Fácil crescimento conforme demanda
- **Free tier generoso** - 512MB gratuitos
- **Integração simples** - Mongoose facilita o uso com Node.js

### Por que Multer?

- **Padrão de mercado** para upload em Node.js
- **Suporte a multipart/form-data**
- **Controle granular** de validações
- **Fácil integração** com Express

### Por que Sharp?

- **Performance superior** ao ImageMagick
- **API moderna** com Promises
- **Formato WebP** e otimizações avançadas
- **Redimensionamento inteligente** com múltiplos algoritmos

---

## 📞 Contato

**Leticia Cristina Silva**  
RA: 21352  
Email: [seu-email@exemplo.com]  
GitHub: [leticiaacristinaa](https://github.com/leticiaacristinaa)

---

## 📝 Conclusão

A implementação do sistema de anexos com MongoDB Atlas foi concluída com sucesso, integrando perfeitamente com a arquitetura existente do Planeja-AI. O sistema é robusto, seguro e oferece uma excelente experiência ao usuário, permitindo upload, visualização e gerenciamento eficiente de arquivos anexados às tarefas.

A escolha do MongoDB Atlas como banco de dados NoSQL se mostrou acertada, proporcionando flexibilidade, escalabilidade e facilidade de integração com o stack tecnológico do projeto.

---

**Desenvolvido com 💜 por Leticia Cristina Silva**
