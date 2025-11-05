# 📎 Sistema de Anexos com MongoDB

## Visão Geral

Sistema de upload e gerenciamento de anexos para tarefas usando MongoDB como banco NoSQL complementar ao PostgreSQL.

### Arquitetura Híbrida

- **PostgreSQL (Supabase)**: Dados estruturados (usuários, listas, tarefas)
- **MongoDB**: Arquivos e metadados de anexos
- **Filesystem**: Armazenamento físico dos arquivos

## 🚀 Configuração do MongoDB

### ✅ Opção 1: MongoDB Atlas Cloud (RECOMENDADO - EM USO)

**O projeto já está configurado com MongoDB Atlas!**

```env
# Já configurado no .env
MONGODB_URI="mongodb+srv://leticiacristina21352_db_user:UgOCTDcMLJib8018@cluster0.bnvlisb.mongodb.net/?appName=Cluster0"
MONGODB_DB_NAME="planeja_ai"
```

**Vantagens:**
- ✅ Sem necessidade de instalação local
- ✅ Backup automático
- ✅ Escalável
- ✅ Acesso de qualquer lugar
- ✅ Free tier generoso (512MB)

### Opção 2: Docker (Local)

```bash
docker run -d \
  --name planeja-mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

Ajuste o `.env`:
```env
MONGODB_URI="mongodb://localhost:27017"
```

### Opção 3: Instalação Local (Ubuntu/Debian)

```bash
# Importar chave pública
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Adicionar repositório
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar serviço
sudo systemctl start mongod
sudo systemctl enable mongod
```

Ajuste o `.env`:
```env
MONGODB_URI="mongodb://localhost:27017"
```

### Verificar Conexão

```bash
# MongoDB Atlas
mongosh "mongodb+srv://cluster0.bnvlisb.mongodb.net/" --username leticiacristina21352_db_user

# Local
mongosh
# ou
docker exec -it planeja-mongodb mongosh
```

## 📁 Estrutura de Arquivos

```
backend/
├── uploads/
│   └── tasks/
│       └── {task_id}/
│           ├── original/
│           │   └── arquivo-1234567890-abc123.jpg
│           └── thumbnails/
│               └── arquivo-1234567890-abc123.jpg
├── src/
│   ├── config/
│   │   └── mongodb.ts          # Configuração da conexão
│   ├── models/
│   │   └── TaskAttachment.ts   # Model MongoDB
│   ├── controllers/
│   │   └── attachmentController.ts
│   ├── middleware/
│   │   └── upload.ts           # Multer config
│   ├── utils/
│   │   └── imageProcessor.ts   # Sharp para thumbnails
│   └── routes/
│       └── attachments.ts
```

## 🔌 Endpoints da API

### 1. Upload de Anexos

```http
POST /api/v1/tasks/:taskId/attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [arquivo1, arquivo2, ...]
```

**Exemplo com cURL:**

```bash
curl -X POST http://localhost:3001/api/v1/tasks/1/attachments \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.png"
```

**Exemplo com JavaScript (fetch):**

```javascript
const formData = new FormData();
formData.append('files', fileInput.files[0]);
formData.append('files', fileInput.files[1]);

const response = await fetch('/api/v1/tasks/1/attachments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.attachments);
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "message": "2 arquivo(s) enviado(s) com sucesso",
  "attachments": [
    {
      "id": "673745abc123def456789012",
      "filename": "minha-imagem.jpg",
      "url": "/api/v1/attachments/1/minha-imagem-1234567890-abc123.jpg",
      "thumbnail_url": "/api/v1/attachments/1/thumb/minha-imagem-1234567890-abc123.jpg",
      "size": 245678,
      "mimetype": "image/jpeg",
      "uploaded_at": "2025-11-15T21:30:00.000Z"
    }
  ]
}
```

### 2. Listar Anexos de uma Task

```http
GET /api/v1/tasks/:taskId/attachments
Authorization: Bearer {token}
```

**Exemplo:**

```bash
curl http://localhost:3001/api/v1/tasks/1/attachments \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta:**

```json
{
  "success": true,
  "count": 2,
  "attachments": [
    {
      "id": "673745abc123def456789012",
      "filename": "capa-projeto.jpg",
      "url": "/api/v1/attachments/1/capa-projeto-1234567890-abc123.jpg",
      "thumbnail_url": "/api/v1/attachments/1/thumb/capa-projeto-1234567890-abc123.jpg",
      "size": 245678,
      "mimetype": "image/jpeg",
      "is_cover": true,
      "uploaded_at": "2025-11-15T21:30:00.000Z"
    }
  ]
}
```

### 3. Deletar Anexo

```http
DELETE /api/v1/tasks/:taskId/attachments/:attachmentId
Authorization: Bearer {token}
```

**Exemplo:**

```bash
curl -X DELETE http://localhost:3001/api/v1/tasks/1/attachments/673745abc123def456789012 \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### 4. Definir como Capa

```http
PUT /api/v1/tasks/:taskId/attachments/:attachmentId/set-cover
Authorization: Bearer {token}
```

### 5. Acessar Arquivo Original

```http
GET /api/v1/attachments/:taskId/:filename
```

### 6. Acessar Thumbnail

```http
GET /api/v1/attachments/:taskId/thumb/:filename
```

## 🖼️ Processamento de Imagens

### Thumbnails Automáticos

- **Dimensão**: 300x300px (mantém proporção)
- **Formato**: JPEG
- **Qualidade**: 80%
- **Comportamento**: Redimensiona dentro do quadrado, sem distorção

### Tipos de Arquivo Suportados

- **Imagens**: JPG, PNG, GIF, WebP, SVG
- **Documentos**: PDF

### Limites

- **Tamanho máximo por arquivo**: 5MB
- **Máximo de arquivos por upload**: 10
- **Armazenamento**: Filesystem local

## 🗄️ Schema MongoDB

### Collection: `task_attachments`

```javascript
{
  _id: ObjectId,
  task_id: Number,           // FK para to_do_item (PostgreSQL)
  user_id: Number,           // FK para users (PostgreSQL)
  filename: String,          // Nome gerado (único)
  original_name: String,     // Nome original do arquivo
  mimetype: String,          // "image/jpeg", "application/pdf"
  size: Number,              // Bytes
  url: String,               // "/api/v1/attachments/:taskId/:filename"
  thumbnail_url: String,     // "/api/v1/attachments/:taskId/thumb/:filename"
  metadata: {
    width: Number,           // Pixels (apenas imagens)
    height: Number,          // Pixels (apenas imagens)
    format: String,          // "jpeg", "png"
    is_cover: Boolean        // Se é capa da task
  },
  uploaded_at: Date,
  tags: [String]             // Opcional, para futuro
}
```

### Índices Criados

```javascript
db.task_attachments.createIndex({ task_id: 1 });
db.task_attachments.createIndex({ user_id: 1 });
db.task_attachments.createIndex({ uploaded_at: -1 });
```

## 🔐 Segurança

### Validações Implementadas

1. **Autenticação JWT**: Obrigatória para upload/delete
2. **Validação de propriedade**: Verifica se task pertence ao usuário
3. **Filtro de mimetype**: Apenas tipos permitidos
4. **Limite de tamanho**: 5MB por arquivo
5. **Sanitização de nomes**: Remove caracteres especiais

### Proteções

- Arquivos salvos com nomes únicos (timestamp + hash)
- Diretórios isolados por task_id
- Validação de mimetype no backend (não confia no frontend)

## 🧪 Testando a API

### 1. Fazer Login

```bash
# Registrar usuário (se necessário)
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste@example.com",
    "password": "senha123"
  }'

# Fazer login e obter token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

### 2. Criar uma Task

```bash
TASK_ID=$(curl -s -X POST http://localhost:3001/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Task com Anexos",
    "description": "Task para testar anexos"
  }' | jq -r '.task.id')

echo "Task ID: $TASK_ID"
```

### 3. Upload de Imagem

```bash
# Criar imagem de teste
convert -size 800x600 xc:blue test-image.jpg

# Upload
curl -X POST "http://localhost:3001/api/v1/tasks/$TASK_ID/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test-image.jpg"
```

### 4. Verificar Anexos

```bash
curl "http://localhost:3001/api/v1/tasks/$TASK_ID/attachments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 📊 Monitoramento

### Verificar Status do MongoDB

```bash
# Via Docker
docker logs planeja-mongodb

# Via mongosh
mongosh --eval "db.adminCommand('serverStatus')"
```

### Estatísticas da Collection

```javascript
use planeja_ai;

// Total de anexos
db.task_attachments.countDocuments();

// Espaço usado
db.task_attachments.stats();

// Anexos por task
db.task_attachments.aggregate([
  { $group: { _id: "$task_id", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

## 🐛 Troubleshooting

### MongoDB não conecta

```bash
# Verificar se está rodando
docker ps | grep mongo
# ou
sudo systemctl status mongod

# Ver logs
docker logs planeja-mongodb
# ou
sudo journalctl -u mongod
```

### Erro "ENOENT: no such file or directory"

```bash
# Criar diretório de uploads
mkdir -p backend/uploads/tasks
```

### Erro de permissão nos arquivos

```bash
# Ajustar permissões
chmod -R 755 backend/uploads
```

### Thumbnails não são gerados

Verifique se sharp está instalado corretamente:

```bash
cd backend
npm rebuild sharp
```

## 🚀 Próximos Passos

### Para Produção

1. **Cloud Storage**: Migrar de filesystem para S3/CloudFlare R2
2. **CDN**: Servir arquivos via CDN
3. **Webhooks**: Notificar frontend quando upload completo
4. **Processamento assíncrono**: Queue para thumbnails
5. **Backup**: Rotina de backup dos arquivos

### Melhorias

- [ ] Suporte para vídeos (thumbnails de vídeo)
- [ ] Compressão automática de imagens grandes
- [ ] Tags e busca de anexos
- [ ] Compartilhamento de anexos entre tasks
- [ ] Histórico de versões de arquivos

## 📝 Notas Importantes

- O MongoDB é **opcional**. Se não estiver disponível, o sistema continua funcionando sem anexos
- Os anexos são **isolados por task** e **por usuário**
- O relacionamento com PostgreSQL é via `task_id` (FK simulado)
- Thumbnails são gerados apenas para imagens (não para PDFs)

---

**Desenvolvido por**: Equipe Planeja-AI  
**Responsável pelo NoSQL**: Leticia Cristina Silva (RA: 21352)
