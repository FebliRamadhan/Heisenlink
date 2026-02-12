#!/bin/bash

# ===========================================
# Heisenlink - SSL Certificate Initialization
# ===========================================
# Usage: ./init-ssl.sh yourdomain.com [your@email.com]
#
# This script initializes Let's Encrypt SSL certificates
# for the first time using certbot.

set -e

DOMAIN=${1:?"Usage: $0 <domain> [email]"}
EMAIL=${2:-"admin@$DOMAIN"}
SSL_DIR="./docker/nginx/ssl"

echo "🔐 Initializing SSL for: $DOMAIN"
echo "📧 Email: $EMAIL"

# Create SSL directory
mkdir -p "$SSL_DIR"

# Step 1: Generate self-signed cert for initial nginx startup
echo "📝 Generating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:4096 \
  -days 1 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" \
  2>/dev/null

echo "✅ Temporary certificate created"

# Step 2: Start nginx with temp cert
echo "🚀 Starting nginx..."
docker compose up -d nginx

# Step 3: Request real certificate from Let's Encrypt
echo "🔒 Requesting Let's Encrypt certificate..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Step 4: Copy real certs
echo "📋 Installing certificates..."
cp "$SSL_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/fullchain.pem"
cp "$SSL_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/privkey.pem"

# Step 5: Reload nginx
echo "🔄 Reloading nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "✅ SSL initialized successfully for $DOMAIN!"
echo ""
echo "⏰ Auto-renewal is handled by the certbot container."
echo "   Certificates renew every 12 hours (if expiring soon)."
echo ""
echo "🧪 Test: curl -I https://$DOMAIN"
