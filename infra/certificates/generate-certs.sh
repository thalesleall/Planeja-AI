#!/bin/bash

# Set the directory where the certificates will be stored
CERT_DIR="$(dirname "$0")"

# Set the certificate and key file names
ROOT_CA_KEY="$CERT_DIR/rootCA.key"
ROOT_CA_PEM="$CERT_DIR/rootCA.pem"
SERVER_KEY="$CERT_DIR/privkey.pem"
SERVER_CERT="$CERT_DIR/fullchain.pem"

# Check if the certificates already exist
if [ -f "$SERVER_CERT" ] && [ -f "$SERVER_KEY" ]; then
  echo "Certificates already exist. Skipping generation."
  exit 0
fi

# Generate Root CA private key
openssl genrsa -out "$ROOT_CA_KEY" 2048

# Generate Root CA certificate
openssl req -x509 -new -nodes -key "$ROOT_CA_KEY" -sha256 -days 1024 -out "$ROOT_CA_PEM" -subj "/C=US/ST=California/L=San Francisco/O=Planeja-AI/CN=Planeja-AI-CA"

# Generate server private key
openssl genrsa -out "$SERVER_KEY" 2048

# Generate server certificate signing request (CSR)
openssl req -new -key "$SERVER_KEY" -out "$CERT_DIR/server.csr" -subj "/C=US/ST=California/L=San Francisco/O=Planeja-AI/CN=localhost"

# Generate the server certificate and sign it with the Root CA
openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$ROOT_CA_PEM" -CAkey "$ROOT_CA_KEY" -CAcreateserial -out "$CERT_DIR/server.crt" -days 500 -sha256

# Create the fullchain certificate
cat "$CERT_DIR/server.crt" "$ROOT_CA_PEM" > "$SERVER_CERT"

# Clean up the CSR and server certificate files
rm "$CERT_DIR/server.csr" "$CERT_DIR/server.crt" "$CERT_DIR/rootCA.srl"

echo "Certificates generated successfully."