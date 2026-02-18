// ===========================================
// Heisenlink - Database Seed Script
// ===========================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@company.com',
      passwordHash: hashedPassword,
      displayName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${admin.username}`);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);

  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@company.com',
      passwordHash: demoPassword,
      displayName: 'Demo User',
      role: 'USER',
      isActive: true,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.username}`);

  // Create demo shortlinks
  const shortLinks = await Promise.all([
    prisma.shortLink.upsert({
      where: { code: 'demo' },
      update: {},
      create: {
        code: 'demo',
        destinationUrl: 'https://example.com',
        title: 'Demo Link',
        userId: demoUser.id,
        isActive: true,
      },
    }),
    prisma.shortLink.upsert({
      where: { code: 'docs' },
      update: {},
      create: {
        code: 'docs',
        destinationUrl: 'https://docs.example.com',
        title: 'Documentation',
        userId: demoUser.id,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${shortLinks.length} demo shortlinks`);

  // Create demo bio page
  const bioPage = await prisma.bioPage.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      slug: 'demo',
      title: 'Demo User',
      bio: 'This is a demo bio page for testing purposes.',
      theme: 'gradient',
      isPublished: true,
    },
  });

  console.log(`✅ Created bio page: ${bioPage.slug}`);

  // Create demo bio links
  const bioLinks = await Promise.all([
    prisma.bioLink.create({
      data: {
        bioPageId: bioPage.id,
        title: 'My Website',
        url: 'https://example.com',
        icon: 'globe',
        position: 0,
        isVisible: true,
      },
    }),
    prisma.bioLink.create({
      data: {
        bioPageId: bioPage.id,
        title: 'LinkedIn',
        url: 'https://linkedin.com/in/demo',
        icon: 'linkedin',
        position: 1,
        isVisible: true,
      },
    }),
    prisma.bioLink.create({
      data: {
        bioPageId: bioPage.id,
        title: 'GitHub',
        url: 'https://github.com/demo',
        icon: 'github',
        position: 2,
        isVisible: true,
      },
    }),
  ]);

  console.log(`✅ Created ${bioLinks.length} demo bio links`);

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
