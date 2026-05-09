import { PrismaClient } from '@prisma/client';
import { config } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Create test users
  const testUsers = [
    {
      walletAddress: 'test_wallet_1',
      username: 'alice',
    },
    {
      walletAddress: 'test_wallet_2',
      username: 'bob',
    },
    {
      walletAddress: 'test_wallet_3',
      username: 'charlie',
    },
  ];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { walletAddress: userData.walletAddress },
      update: {},
      create: {
        walletAddress: userData.walletAddress,
        username: userData.username,
      },
    });

    console.log(`✅ Created/updated user: ${user.username} (${user.walletAddress})`);
  }

  // Create username registry entries
  for (const userData of testUsers) {
    const user = await prisma.user.findUnique({
      where: { walletAddress: userData.walletAddress },
    });

    if (user) {
      await prisma.usernameRegistry.upsert({
        where: { username: userData.username },
        update: {},
        create: {
          username: userData.username,
          walletAddress: userData.walletAddress,
          userId: user.id,
        },
      });

      console.log(`✅ Created/updated username registry: ${userData.username}`);
    }
  }

  console.log('🌱 Database seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });