import { PrismaClient, Role, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminInitial123!';
  const demoUserPassword = process.env.DEMO_USER_PASSWORD || 'DemoInitial123!';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const demoUserPasswordHash = await bcrypt.hash(demoUserPassword, 10);

  // 1. Seed Administrator
  await prisma.user.upsert({
    where: { email: 'admin@pocket48.local' },
    update: {
      passwordHash: adminPasswordHash,
      displayName: 'System Administrator',
      role: Role.ADMINISTRATOR,
      isActive: true,
    },
    create: {
      email: 'admin@pocket48.local',
      passwordHash: adminPasswordHash,
      displayName: 'System Administrator',
      role: Role.ADMINISTRATOR,
      isActive: true,
    },
  });

  // 2. Seed Demo User 1
  await prisma.user.upsert({
    where: { email: 'user1@pocket48.local' },
    update: {
      passwordHash: demoUserPasswordHash,
      displayName: 'Demo User 1',
      role: Role.USER,
      isActive: true,
    },
    create: {
      email: 'user1@pocket48.local',
      passwordHash: demoUserPasswordHash,
      displayName: 'Demo User 1',
      role: Role.USER,
      isActive: true,
    },
  });

  // 3. Seed Demo User 2
  await prisma.user.upsert({
    where: { email: 'user2@pocket48.local' },
    update: {
      passwordHash: demoUserPasswordHash,
      displayName: 'Demo User 2',
      role: Role.USER,
      isActive: true,
    },
    create: {
      email: 'user2@pocket48.local',
      passwordHash: demoUserPasswordHash,
      displayName: 'Demo User 2',
      role: Role.USER,
      isActive: true,
    },
  });

  // 4. Seed Initial Categories
  const initialCategories: { name: string; type: TransactionType }[] = [
    // Expense Categories
    { name: 'Food & Beverage', type: TransactionType.EXPENSE },
    { name: 'Transportation', type: TransactionType.EXPENSE },
    { name: 'Utilities', type: TransactionType.EXPENSE },
    { name: 'Housing', type: TransactionType.EXPENSE },
    { name: 'Entertainment', type: TransactionType.EXPENSE },
    // Income Categories
    { name: 'Salary', type: TransactionType.INCOME },
    { name: 'Freelance', type: TransactionType.INCOME },
    { name: 'Investment', type: TransactionType.INCOME },
  ];

  for (const cat of initialCategories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: cat.name,
          type: cat.type,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        name: cat.name,
        type: cat.type,
        isActive: true,
      },
    });
  }

  console.log('Seed completed successfully (idempotent).');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
