# 🧪 Heisenlink

> "I am the one who shortens." – A self-hosted URL shortener & bio page platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

**Heisenlink** is an enterprise-grade, self-hosted platform for managing short links and bio pages. Take full control of your URLs with analytics, QR codes, link scheduling, and team management.

## ✨ Features

- 🔗 **Shortlinks** – Custom aliases, password protection, expiration dates
- 📄 **Bio Pages** – Linktree-style pages with 13+ themes
- 📊 **Analytics** – Click tracking, referrer data, device/browser stats
- 📱 **QR Codes** – Auto-generated, downloadable in PNG/SVG
- ⏰ **Scheduling** – Schedule links to activate at a future date
- 👥 **Team Ready** – Role-based access (Admin/User)
- 🔐 **Enterprise Auth** – LDAP/Active Directory support
- 📦 **Bulk Export** – Export links & audit logs as CSV/JSON
- 🎨 **Themeable** – 13 bio page themes including Neon, Aurora, Corporate

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Auth** | JWT + LDAP |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/heisenlink.git
cd heisenlink

# Configure environment
cp .env.example .env

# Start with Docker
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# API: http://localhost:3000/api
```

### Local Development

```bash
# Install dependencies
npm install

# Start database & cache
docker-compose up -d postgres redis

# Run migrations
npx prisma migrate dev

# Seed admin user
npm run db:seed

# Start dev servers
npm run dev
```

## 🔐 Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgresql://user:pass@localhost:5435/heisenlink
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key
BASE_URL=http://localhost:3000
LDAP_URL=ldap://your-ldap-server
```

See `.env.example` for all options.

## 📸 Screenshots

Coming soon...

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT © 2024

---

> *"Say my link."* 🧪
