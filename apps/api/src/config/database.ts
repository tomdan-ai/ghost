import { PrismaClient } from '@prisma/client';
import { config } from './env';

// Construct database URL from Supabase URL
function getDatabaseUrl(): string {
  const supabaseUrl = config.supabase.url;
  const serviceRoleKey = config.supabase.serviceRoleKey;

  // Extract project reference from Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    throw new Error('Invalid Supabase URL format');
  }

  // Construct PostgreSQL connection string
  return `postgresql://postgres:${serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
}

export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
