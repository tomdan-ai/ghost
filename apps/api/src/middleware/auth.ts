import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';

const authService = new AuthService();

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Bearer token is required for this endpoint',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid or expired',
      });
    }

    // Check if token is expired
    if (authService.isTokenExpired(token)) {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'The provided token has expired',
      });
    }

    let user;
    try {
      // Get user from database
      user = await prisma.user.findUnique({
        where: { walletAddress: decoded.walletAddress },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token no longer exists',
        });
      }
    } catch (dbError) {
      console.warn('Authentication DB lookup failed, using token payload:', dbError);
      user = {
        id: decoded.walletAddress,
        walletAddress: decoded.walletAddress,
        username: decoded.username ?? null,
        createdAt: new Date(),
      };
      (req as any).authDbUnavailable = true;
    }

    // Add user to request object
    (req as any).user = user;
    (req as any).token = token;

    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTHENTICATION_FAILED',
      message: 'Unable to authenticate request',
    });
  }
};

// Optional authentication middleware (continues even if not authenticated)
export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);

      if (decoded && !authService.isTokenExpired(token)) {
        const user = await prisma.user.findUnique({
          where: { walletAddress: decoded.walletAddress },
          select: {
            id: true,
            walletAddress: true,
            username: true,
            createdAt: true,
          },
        });

        if (user) {
          (req as any).user = user;
          (req as any).token = token;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    console.warn('Optional authentication failed:', error);
    next();
  }
};

// Role-based authorization middleware (placeholder for future roles)
export const authorize = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required for this endpoint',
        });
      }

      // TODO: Implement role-based authorization when roles are added
      // For now, all authenticated users are authorized
      
      return next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        error: 'Authorization failed',
        code: 'AUTHORIZATION_FAILED',
        message: 'Unable to authorize request',
      });
    }
  };
};

// Ownership check middleware (user can only access their own resources)
export const checkOwnership = (resourceParam: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required for this endpoint',
        });
      }

      const resourceId = req.params[resourceParam] || req.body[resourceParam];
      
      if (!resourceId) {
        return res.status(400).json({
          error: 'Resource identifier required',
          code: 'VALIDATION_ERROR',
          message: `Resource identifier (${resourceParam}) is required`,
        });
      }

      // Check if user owns the resource
      // This is a simple check - in production, you'd query the database
      if (resourceId !== user.id && resourceId !== user.walletAddress) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to access this resource',
        });
      }

      return next();
    } catch (error) {
      console.error('Ownership check middleware error:', error);
      return res.status(500).json({
        error: 'Ownership check failed',
        code: 'OWNERSHIP_CHECK_FAILED',
        message: 'Unable to verify resource ownership',
      });
    }
  };
};

// Rate limiting for authenticated endpoints
export const authenticatedRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    
    if (user) {
      // User is authenticated - apply user-based rate limiting
      // This is handled by the global rateLimitMiddleware
      return next();
    }

    // User is not authenticated - apply IP-based rate limiting
    // This is also handled by the global rateLimitMiddleware
    next();
  } catch (error) {
    console.error('Authenticated rate limit middleware error:', error);
    // Allow request if rate limiting fails
    next();
  }
};
