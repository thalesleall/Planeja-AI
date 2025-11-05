# 🌩️ MongoDB Atlas - Configuração Cloud

## ✅ Status Atual

O projeto **Planeja-AI** está configurado e conectado ao **MongoDB Atlas** (cloud):

```
Cluster: cluster0.bnvlisb.mongodb.net
Database: planeja_ai
Collection: task_attachments
Região: AWS (provavelmente us-east-1)
Tier: M0 (Free - 512MB)
```

## 🔑 Credenciais em Uso

```env
MONGODB_URI="mongodb+srv://leticiacristina21352_db_user:UgOCTDcMLJib8018@cluster0.bnvlisb.mongodb.net/?appName=Cluster0"
MONGODB_DB_NAME="planeja_ai"
```

**⚠️ Observação de Segurança:**
- Estas credenciais estão no código para fins acadêmicos
- Para produção real, use variáveis de ambiente protegidas
- Considere rotacionar a senha após a apresentação do projeto

## 📊 Acessar MongoDB Atlas

### Via Interface Web

1. Acesse: https://cloud.mongodb.com/
2. Login com conta da Leticia
3. Navegue até: **Cluster0** → **Browse Collections**
4. Selecione database: **planeja_ai**
5. Collection: **task_attachments**

### Via MongoDB Compass (GUI Desktop)

1. Download: https://www.mongodb.com/try/download/compass
2. Conectar com URI:
   ```
   mongodb+srv://leticiacristina21352_db_user:UgOCTDcMLJib8018@cluster0.bnvlisb.mongodb.net/
   ```
3. Selecionar database: `planeja_ai`

### Via mongosh (Terminal)

```bash
# Instalar mongosh
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-mongosh

# Conectar
mongosh "mongodb+srv://cluster0.bnvlisb.mongodb.net/" \
  --username leticiacristina21352_db_user \
  --password UgOCTDcMLJib8018

# Dentro do mongosh
use planeja_ai
db.task_attachments.find().pretty()
```

## 🔍 Queries Úteis

### Verificar documentos salvos

```javascript
// Contar anexos
db.task_attachments.countDocuments()

// Ver todos os anexos
db.task_attachments.find().pretty()

// Anexos de uma task específica
db.task_attachments.find({ task_id: 1 })

// Anexos marcados como capa
db.task_attachments.find({ "metadata.is_cover": true })

// Anexos por usuário
db.task_attachments.find({ user_id: 1 })
```

### Estatísticas

```javascript
// Espaço usado pela collection
db.task_attachments.stats()

// Anexos por task (agregação)
db.task_attachments.aggregate([
  { $group: { 
      _id: "$task_id", 
      count: { $sum: 1 },
      total_size: { $sum: "$size" }
  }},
  { $sort: { count: -1 } }
])

// Tipos de arquivo mais usados
db.task_attachments.aggregate([
  { $group: { 
      _id: "$mimetype", 
      count: { $sum: 1 }
  }},
  { $sort: { count: -1 } }
])
```

### Verificar índices

```javascript
db.task_attachments.getIndexes()
```

Deve retornar:
```json
[
  { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
  { "v": 2, "key": { "task_id": 1 }, "name": "task_id_1" },
  { "v": 2, "key": { "user_id": 1 }, "name": "user_id_1" },
  { "v": 2, "key": { "uploaded_at": -1 }, "name": "uploaded_at_-1" }
]
```

## 📈 Monitoramento

### No Atlas Dashboard

1. **Metrics** → Ver uso de:
   - Connections
   - Network I/O
   - Operations per second
   - Storage size

2. **Performance Advisor**
   - Sugestões de índices
   - Queries lentas

3. **Alerts**
   - Configurar alertas de uso
   - Email quando atingir limites

### Via API Backend

O backend já exibe no console:

```
✅ MongoDB conectado com sucesso (Atlas Cloud)
📦 Database: planeja_ai
📇 Índices criados: task_id, user_id, uploaded_at
✅ MongoDB attachment system ready
```

## 🚨 Troubleshooting

### Erro: "Authentication failed"

```bash
# Verificar credenciais
# A senha contém caracteres especiais? Pode precisar de URL encoding

# Testar conexão básica
mongosh "mongodb+srv://cluster0.bnvlisb.mongodb.net/" \
  --username leticiacristina21352_db_user
```

### Erro: "Network timeout"

- Verificar se IP está na whitelist do Atlas
- No Atlas: **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)

### Erro: "Database does not exist"

```javascript
// Criar database (automático no primeiro insert)
use planeja_ai
db.task_attachments.insertOne({ test: true })
db.task_attachments.deleteOne({ test: true })
```

## 📦 Limites do Free Tier (M0)

- **Storage**: 512 MB
- **RAM**: Shared
- **Connections**: 500 simultâneas
- **Backups**: Não incluído
- **Regions**: Limitado

### Quando migrar para tier pago?

Considere M10 ($0.08/hour) se:
- Armazenamento > 400MB
- Conexões frequentes > 100
- Necessidade de backups automáticos
- Performance crítica

## 🔐 Segurança

### Boas Práticas Implementadas

✅ Usuário dedicado (não root)  
✅ Senha forte  
✅ Conexão via TLS/SSL (mongodb+srv)  
✅ Database isolado  

### Recomendações Adicionais

- [ ] IP Whitelist (permitir apenas IPs conhecidos)
- [ ] Rotação de senha periódica
- [ ] Audit logs habilitados
- [ ] Variáveis de ambiente em produção

## 📝 Schema Atual

```javascript
{
  _id: ObjectId("..."),
  task_id: 1,
  user_id: 1,
  filename: "arquivo-1234567890-abc123.jpg",
  original_name: "minha-foto.jpg",
  mimetype: "image/jpeg",
  size: 245678,
  url: "/api/v1/attachments/1/arquivo-1234567890-abc123.jpg",
  thumbnail_url: "/api/v1/attachments/1/thumb/arquivo-1234567890-abc123.jpg",
  metadata: {
    width: 1920,
    height: 1080,
    format: "jpeg",
    is_cover: false
  },
  uploaded_at: ISODate("2025-11-15T21:30:00.000Z"),
  tags: []
}
```

## 🎓 Demonstração Acadêmica

### Para Apresentação

1. **Mostrar Atlas Dashboard**
   - Cluster ativo
   - Database `planeja_ai`
   - Collection `task_attachments`

2. **Executar queries ao vivo**
   ```javascript
   // No mongosh ou Compass
   db.task_attachments.find().pretty()
   db.task_attachments.countDocuments()
   ```

3. **Upload via API**
   ```bash
   # Mostrar no Postman ou cURL
   curl -X POST http://localhost:3001/api/v1/tasks/1/attachments \
     -H "Authorization: Bearer $TOKEN" \
     -F "files=@imagem.jpg"
   ```

4. **Verificar documento criado**
   ```javascript
   // Refresh no Atlas/Compass
   db.task_attachments.find().sort({ uploaded_at: -1 }).limit(1)
   ```

### Pontos a Destacar

✅ **Híbrido SQL + NoSQL**: PostgreSQL (tasks) + MongoDB (anexos)  
✅ **Cloud-native**: Sem infraestrutura local necessária  
✅ **Escalável**: Pode migrar para tier pago conforme necessidade  
✅ **Produção-ready**: Mesma tecnologia usada por empresas  

## 📚 Recursos

- **Documentação**: https://www.mongodb.com/docs/atlas/
- **Drivers Node.js**: https://www.mongodb.com/docs/drivers/node/
- **University (Free)**: https://university.mongodb.com/
- **Community**: https://www.mongodb.com/community/forums/

---

**Configurado por**: Leticia Cristina Silva (RA: 21352)  
**Projeto**: Planeja-AI - Sistema de Gerenciamento de Tarefas  
**Data**: 15 de novembro de 2025
