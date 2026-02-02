const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv/config');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Create users
  await prisma.userSport.upsert({
    where: { email: 'admin@gym.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@gym.local',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.userSport.upsert({
    where: { email: 'accueil@gym.local' },
    update: {},
    create: {
      name: 'Accueil',
      email: 'accueil@gym.local',
      password: await bcrypt.hash('accueil123', 10),
      role: 'ACCUEIL',
    },
  });

  await prisma.userSport.upsert({
    where: { email: 'direction@gym.local' },
    update: {},
    create: {
      name: 'Direction',
      email: 'direction@gym.local',
      password: await bcrypt.hash('direction123', 10),
      role: 'DIRECTION',
    },
  });

  // Create or update demo members idempotently (avoid unique constraint violations)
  for (let i = 1; i <= 10; i++) {
    const member = await prisma.memberSport.upsert({
      where: { phone: `060000000${i}` },
      update: {
        firstName: `Membre${i}`,
        lastName: 'Demo',
        email: `membre${i}@gym.local`,
        status: i % 3 === 0 ? 'EXPIRE' : 'ACTIF',
      },
      create: {
        firstName: `Membre${i}`,
        lastName: 'Demo',
        phone: `060000000${i}`,
        email: `membre${i}@gym.local`,
        status: i % 3 === 0 ? 'EXPIRE' : 'ACTIF',
        qrCode: `QR-${i}-${Date.now()}`,
      },
    });

    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    const sub = await prisma.subscriptionSport.create({
      data: {
        memberId: member.id,
        type: 'MENSUEL',
        startDate: start,
        endDate: end,
        status: 'ACTIF',
        price: '25000',
      },
    });

    await prisma.paymentSport.create({
      data: {
        memberId: member.id,
        subscriptionId: sub.id,
        amount: '25000',
        method: 'ESPECES',
        isPaid: true,
        receiptNumber: `REC-${i}-${Date.now()}`,
      },
    });
  }

  // Create sample class
  const yoga = await prisma.classSport.create({
    data: {
      name: 'Yoga débutants',
      description: 'Séance relaxante pour débutants',
      dayOfWeek: 2,
      startTime: '18:00',
      endTime: '19:00',
      maxParticipants: 15,
      coachName: 'Alice',
    },
  });

  // Attendance demo
  const firstMember = await prisma.memberSport.findFirst();
  if (firstMember) {
    await prisma.attendanceSport.create({
      data: {
        memberId: firstMember.id,
        classId: yoga.id,
      },
    });

    await prisma.accessLogSport.create({
      data: {
        memberId: firstMember.id,
        allowed: true,
        reason: 'Abonnement valide',
      },
    });

    await prisma.notificationSport.create({
      data: {
        memberId: firstMember.id,
        type: 'EMAIL',
        content: 'Rappel: votre abonnement expire bientôt.',
        status: 'EN_ATTENTE',
      },
    });
  }
}

main()
  .then(() => console.log('Seed completed'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
