# LinkHub Deployment Guide

This guide covers deploying LinkHub to a production environment.

## 1. Prerequisites

- Linux Server (Ubuntu 20.04/22.04 recommended)
- Docker Engine & Docker Compose
- Domain name (e.g., links.example.com)
- SSL Certificate (or automated via Let's Encrypt/Certbot/Traefik)

## 2. Environment Configuration

1. Copy the production environment file:
   ```bash
   cp .env.example .env.production
   ```

2. Edit `.env.production` with secure values:
   - `NODE_ENV=production`
   - `DATABASE_URL`: Your production PostgreSQL connection string
   - `REDIS_URL`: Your production Redis connection string
   - `JWT_SECRET`: Generate a strong random string (`openssl rand -base64 32`)
   - `LDAP_*`: Configure your LDAP server details
   - `NEXT_PUBLIC_APP_URL`: The public URL of your instance (e.g., `https://links.example.com`)

## 3. Docker Deployment

We recommend using the provided `docker-compose.yml` (or a production variant) to orchestrate services.

### Build and Run

```bash
# Build the production image
docker build -t linkhub:latest .

# Run with docker-compose
docker-compose -f docker-compose.yml up -d
```

### Nginx Reverse Proxy

It is recommended to place Nginx in front of the application to handle SSL termination and static file caching.

Example Nginx config:

```nginx
server {
    listen 80;
    server_name links.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name links.example.com;

    ssl_certificate /etc/letsencrypt/live/links.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/links.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 4. Database Management

### Migrations
Always run migrations before starting the new version of the app.

```bash
docker-compose exec linkhub npm run db:migrate
```

### Backups
Set up a cron job to run the backup script daily.

```bash
# Crontab example (Daily at 2 AM)
0 2 * * * /path/to/linkhub/scripts/backup.sh >> /var/log/linkhub_backup.log 2>&1
```

## 5. Updates

To update LinkHub:

1. Pull the latest code: `git pull`
2. Rebuild the image: `docker build -t linkhub:latest .`
3. Stop current containers: `docker-compose down`
4. Run migrations: `npm run db:migrate`
5. Start containers: `docker-compose up -d`

## 6. Troubleshooting

View logs:
```bash
docker-compose logs -f linkhub
```
