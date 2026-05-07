import { prisma } from '../../config/database';

export class UsernameService {
  async checkAvailability(username: string): Promise<boolean> {
    const existing = await prisma.usernameRegistry.findUnique({
      where: { username },
    });
    
    return !existing;
  }

  async register(username: string, walletAddress: string, userId: string) {
    const isAvailable = await this.checkAvailability(username);
    
    if (!isAvailable) {
      throw new Error('Username already taken');
    }

    const registry = await prisma.usernameRegistry.create({
      data: {
        username,
        walletAddress,
        userId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    return registry;
  }

  async resolve(username: string) {
    return prisma.usernameRegistry.findUnique({
      where: { username },
      include: { user: true },
    });
  }

  async getByWallet(walletAddress: string) {
    return prisma.usernameRegistry.findUnique({
      where: { walletAddress },
    });
  }
}
