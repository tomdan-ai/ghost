// Prisma is not set up yet - using Supabase directly
// import { PrismaClient } from '@prisma/client';

// export const prisma = new PrismaClient({
//   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
// });

// Stub for now - will be replaced with Supabase queries
export const prisma = null as any;

export async function connectDatabase() {
  console.log('✅ Using Supabase for database (Prisma not configured)');
}

export async function disconnectDatabase() {
  // No-op for Supabase
}
