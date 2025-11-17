#!/bin/bash

# Script de teste da API de Anexos
# Uso: ./test-attachments.sh

set -e

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api/v1"

echo "🧪 Testando API de Anexos do Planeja-AI"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se MongoDB está rodando
echo -e "${BLUE}1. Verificando MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB está rodando${NC}"
    else
        echo -e "${RED}✗ MongoDB não está acessível${NC}"
        echo "Execute: docker run -d -p 27017:27017 --name mongo mongo:latest"
        exit 1
    fi
else
    echo -e "${RED}✗ mongosh não encontrado${NC}"
    echo "MongoDB pode não estar instalado"
fi
echo ""

# Verificar se backend está rodando
echo -e "${BLUE}2. Verificando Backend...${NC}"
if curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ Backend está rodando${NC}"
else
    echo -e "${RED}✗ Backend não está acessível em $BASE_URL${NC}"
    echo "Execute: cd backend && npm run dev"
    exit 1
fi
echo ""

# Login para obter token
echo -e "${BLUE}3. Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Falha no login. Criando usuário...${NC}"
    
    # Tentar registrar
    REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Usuario Teste",
        "email": "teste@example.com",
        "password": "senha123"
      }')
    
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
    
    if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ Falha no registro${NC}"
        echo $REGISTER_RESPONSE | jq
        exit 1
    fi
    
    echo -e "${GREEN}✓ Usuário criado com sucesso${NC}"
else
    echo -e "${GREEN}✓ Login realizado com sucesso${NC}"
fi

echo "Token: ${TOKEN:0:20}..."
echo ""

# Criar uma task para testar
echo -e "${BLUE}4. Criando task de teste...${NC}"
CREATE_TASK_RESPONSE=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Task com Anexos - Teste",
    "description": "Task criada automaticamente para testar anexos"
  }')

TASK_ID=$(echo $CREATE_TASK_RESPONSE | jq -r '.task.id')

if [ "$TASK_ID" == "null" ] || [ -z "$TASK_ID" ]; then
    echo -e "${RED}✗ Falha ao criar task${NC}"
    echo $CREATE_TASK_RESPONSE | jq
    exit 1
fi

echo -e "${GREEN}✓ Task criada: ID=$TASK_ID${NC}"
echo ""

# Criar imagem de teste
echo -e "${BLUE}5. Criando imagem de teste...${NC}"
if command -v convert &> /dev/null; then
    convert -size 800x600 xc:blue -pointsize 72 -fill white -gravity center \
      -annotate +0+0 "Teste\nAnexos" /tmp/test-image.jpg
    echo -e "${GREEN}✓ Imagem criada: /tmp/test-image.jpg${NC}"
else
    echo -e "${RED}✗ ImageMagick não instalado. Criando arquivo dummy...${NC}"
    echo "Arquivo de teste" > /tmp/test-image.txt
fi
echo ""

# Upload de arquivo
echo -e "${BLUE}6. Fazendo upload de arquivo...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$TASK_ID/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/test-image.jpg" 2>/dev/null || \
  curl -s -X POST "$API_URL/tasks/$TASK_ID/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/test-image.txt")

echo $UPLOAD_RESPONSE | jq

if echo $UPLOAD_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Upload realizado com sucesso${NC}"
    ATTACHMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.attachments[0].id')
    ATTACHMENT_URL=$(echo $UPLOAD_RESPONSE | jq -r '.attachments[0].url')
else
    echo -e "${RED}✗ Falha no upload${NC}"
    exit 1
fi
echo ""

# Listar anexos
echo -e "${BLUE}7. Listando anexos da task...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_URL/tasks/$TASK_ID/attachments" \
  -H "Authorization: Bearer $TOKEN")

echo $LIST_RESPONSE | jq

COUNT=$(echo $LIST_RESPONSE | jq -r '.count')
echo -e "${GREEN}✓ Total de anexos: $COUNT${NC}"
echo ""

# Acessar arquivo
echo -e "${BLUE}8. Verificando acesso ao arquivo...${NC}"
FILE_URL="$BASE_URL$ATTACHMENT_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FILE_URL")

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Arquivo acessível: $FILE_URL${NC}"
else
    echo -e "${RED}✗ Arquivo não acessível (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Definir como capa
if [ ! -z "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "null" ]; then
    echo -e "${BLUE}9. Definindo como capa...${NC}"
    COVER_RESPONSE=$(curl -s -X PUT "$API_URL/tasks/$TASK_ID/attachments/$ATTACHMENT_ID/set-cover" \
      -H "Authorization: Bearer $TOKEN")
    
    echo $COVER_RESPONSE | jq
    
    if echo $COVER_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Capa definida com sucesso${NC}"
    fi
    echo ""
fi

# Deletar anexo
echo -e "${BLUE}10. Deletando anexo...${NC}"
if [ ! -z "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "null" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/tasks/$TASK_ID/attachments/$ATTACHMENT_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo $DELETE_RESPONSE | jq
    
    if echo $DELETE_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Anexo deletado com sucesso${NC}"
    fi
else
    echo -e "${RED}✗ ID do anexo não disponível${NC}"
fi
echo ""

# Limpar
echo -e "${BLUE}11. Limpando arquivos de teste...${NC}"
rm -f /tmp/test-image.jpg /tmp/test-image.txt
echo -e "${GREEN}✓ Arquivos temporários removidos${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}✅ Teste concluído com sucesso!${NC}"
echo ""
echo "📊 Resumo:"
echo "  • Task criada: $TASK_ID"
echo "  • Anexo(s) testado(s): $COUNT"
echo "  • URL do arquivo: $FILE_URL"
echo ""
echo "🔍 Verifique no MongoDB:"
echo "  mongosh"
echo "  use planeja_ai"
echo "  db.task_attachments.find().pretty()"
