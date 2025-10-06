# Infraestrutura Planeja-AI

Este documento descreve a configuração da infraestrutura para o projeto Planeja-AI, que é gerenciado usando Docker e Docker Compose.

## Visão Geral

A infraestrutura é composta por três serviços principais orquestrados por um `docker-compose.yml` na raiz do projeto:

1.  **Frontend:** Uma aplicação Next.js servida por seu próprio servidor NGINX.
2.  **Backend:** Uma API Node.js (TypeScript).
3.  **NGINX Principal:** Um proxy reverso que direciona o tráfego para os serviços de frontend e backend, com terminação SSL.

## Configuração do Docker

### `docker-compose.yml` Raiz

O arquivo `docker-compose.yml` principal na raiz do projeto é responsável por construir e executar todos os serviços. Ele orquestra o frontend, o backend e o proxy reverso NGINX principal.

### Serviço de Frontend

-   **Dockerfile:** `frontend/planeja-ai/Dockerfile`
-   **Descrição:** Este Dockerfile constrói a aplicação frontend Next.js e a serve usando NGINX. É uma compilação de múltiplos estágios que primeiro constrói os arquivos estáticos do aplicativo Next.js e depois os copia para um contêiner NGINX leve.

### Serviço de Backend

-   **Dockerfile:** `backend/Dockerfile`
-   **Descrição:** Este Dockerfile constrói a API de backend Node.js/TypeScript. Ele compila o código TypeScript para JavaScript e executa o servidor.

## Configuração do NGINX

### Proxy Reverso NGINX Principal

-   **Configuração:** `infra/nginx/default.conf`
-   **Descrição:** Esta instância do NGINX atua como o ponto de entrada principal para a aplicação. É um proxy reverso que:
    -   Escuta nas portas 80 e 443.
    -   Redireciona o tráfego HTTP para HTTPS.
    -   Termina o SSL usando os certificados encontrados em `infra/certificates`.
    -   Encaminha as requisições para `/api` para o serviço de backend.
    -   Encaminha todas as outras requisições para o serviço de frontend.

## Certificados SSL

-   **Script de Geração de Certificado:** `infra/certificates/generate-certs.sh`
-   **Certificados:** `fullchain.pem` e `privkey.pem`

Para desenvolvimento local, são usados certificados SSL autoassinados para habilitar o HTTPS.

O script `generate-certs.sh` pode ser usado para gerar os certificados necessários. O servidor NGINX principal é configurado para usar `fullchain.pem` e `privkey.pem` para a terminação SSL.

**Nota:** Estes são certificados autoassinados e devem ser usados apenas para fins de desenvolvimento. Para um ambiente de produção, você deve usar certificados de uma Autoridade de Certificação (CA) confiável.

---

**Desenvolvido por:** Gabriel Davi Lopes Jacobini 24734
**Papel:** DevOps Engineer 
**Tecnologia Principal:** Docker Compose + Nginx
**Data:** Outubro 2025  
**Disciplina:** Desenvolvimento Web 2