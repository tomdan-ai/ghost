import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';

const authService = new AuthService();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: decoded.walletAddress },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { ...decoded, userId: user.id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
