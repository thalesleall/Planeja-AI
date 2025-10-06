# Planeja-AI Infrastructure

This document outlines the infrastructure setup for the Planeja-AI project, which is managed using Docker and Docker Compose.

## Overview

The infrastructure is composed of three main services orchestrated by a root `docker-compose.yml`:

1.  **Frontend:** A Next.js application served by its own NGINX server.
2.  **Backend:** A Node.js (TypeScript) API.
3.  **Main NGINX:** A reverse proxy that directs traffic to the frontend and backend services, with SSL termination using a Certificate Chain.

## Docker Setup

### Root `docker-compose.yml`

The main `docker-compose.yml` file at the root of the project is responsible for building and running all the services. It orchestrates the frontend, backend, and the main NGINX reverse proxy.

### Frontend Service

-   **Dockerfile:** `frontend/planeja-ai/Dockerfile`
-   **Description:** This Dockerfile builds the Next.js frontend application and serves it using NGINX. It's a multi-stage build that first builds the static files from the Next.js app and then copies them into a lightweight NGINX container.

### Backend Service

-   **Dockerfile:** `backend/Dockerfile`
-   **Description:** This Dockerfile builds the Node.js/TypeScript backend API. It compiles the TypeScript code into JavaScript and runs the server.

## NGINX Configuration

### Main NGINX Reverse Proxy

-   **Configuration:** `infra/nginx/default.conf`
-   **Description:** This NGINX instance acts as the main entry point for the application. It's a reverse proxy that:
    -   Listens on ports 80 and 443.
    -   Redirects HTTP traffic to HTTPS.
    -   Terminates SSL using the certificates found in `infra/certificates`.
    -   Forwards requests to `/api` to the backend service.
    -   Forwards all other requests to the frontend service.

## SSL Certificates

-   **Certificate Generation Script:** `infra/certificates/generate-certs.sh`
-   **Certificates:** `fullchain.pem` and `privkey.pem`

For local development, self-signed SSL certificates are used to enable HTTPS.

The `generate-certs.sh` script can be used to generate the necessary certificates. The main NGINX server is configured to use `fullchain.pem` and `privkey.pem` for SSL termination.

**Note:** These are self-signed certificates and should only be used for development purposes. For a production environment, you should use certificates from a trusted Certificate Authority (CA).

## Responsible

- [Gabriel Davi Lopes Jacobini](https://www.linkedin.com/in/gabriel-davi-lopes-jacobini-57168a272/)
- [Diego Murari](https://www.linkedin.com/in/diego-murari/)
