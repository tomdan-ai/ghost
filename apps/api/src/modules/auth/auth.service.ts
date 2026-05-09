import { sign, verify } from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { randomBytes } from 'crypto';
import { config } from '../../config/env';
import { cacheService } from '../../config/redis';

export class AuthService {
  private readonly nonceTtlMs = 10 * 60 * 1000; // 10 minutes
  private readonly jwtSecret = config.security.jwtSecret;
  private readonly jwtExpiresIn = '24h'; // 24 hours

  // Generate a cryptographically random nonce and store it in Redis
  async generateNonce(walletAddress: string): Promise<string> {
    // Validate wallet address format
    if (!this.isValidWalletAddress(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    // Generate cryptographically secure random nonce
    const nonce = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.nonceTtlMs;

    // Store nonce in Redis with expiration
    const nonceData = {
      nonce,
      walletAddress,
      expiresAt,
      createdAt: Date.now(),
    };

    const cacheKey = `nonce:${walletAddress}:${nonce}`;
    const latestKey = `nonce:${walletAddress}`;
    await cacheService.set(cacheKey, nonceData, this.nonceTtlMs);
    await cacheService.set(latestKey, nonceData, this.nonceTtlMs);

    return nonce;
  }

  // Get stored nonce for verification
  async getStoredNonce(
    walletAddress: string,
    nonce?: string
  ): Promise<{
    nonce: string;
    walletAddress: string;
    expiresAt: number;
    createdAt: number;
  } | null> {
    if (nonce) {
      const keyed = await cacheService.get(`nonce:${walletAddress}:${nonce}`);
      if (keyed) {
        return keyed;
      }
    }

    return cacheService.get(`nonce:${walletAddress}`);
  }

  // Verify signature and nonce
  async verifySignature(
    walletAddress: string,
    signature: string,
    signedMessage: string,
    nonce?: string
  ): Promise<boolean> {
    try {
      const resolvedNonce =
        nonce || this.extractNonceFromMessage(signedMessage) || signedMessage;

      // Get stored nonce
      const storedNonce = await this.getStoredNonce(walletAddress, resolvedNonce);
      
      if (!storedNonce) {
        console.warn(`No nonce found for wallet: ${walletAddress}`);
        return false;
      }

      // Check if nonce has expired
      if (storedNonce.expiresAt < Date.now()) {
        console.warn(`Nonce expired for wallet: ${walletAddress}`);
        await this.invalidateNonce(walletAddress);
        return false;
      }

      // Verify the message matches the stored nonce
      if (storedNonce.nonce !== resolvedNonce) {
        console.warn(`Nonce mismatch for wallet: ${walletAddress}`);
        return false;
      }

      // Validate wallet address format
      if (!this.isValidWalletAddress(walletAddress)) {
        console.warn(`Invalid wallet address format: ${walletAddress}`);
        return false;
      }

      // Verify signature based on wallet address type
      let isValidSignature = false;
      
      if (this.isSolanaAddress(walletAddress)) {
        isValidSignature = await this.verifySolanaSignature(
          walletAddress,
          signature,
          signedMessage
        );
      } else if (this.isEthereumAddress(walletAddress)) {
        isValidSignature = await this.verifyEthereumSignature(
          walletAddress,
          signature,
          signedMessage
        );
      } else {
        console.warn(`Unsupported wallet address type: ${walletAddress}`);
        return false;
      }

      if (!isValidSignature) {
        console.warn(`Invalid signature for wallet: ${walletAddress}`);
        return false;
      }

      // Invalidate nonce after successful verification (prevent replay)
      await this.invalidateNonce(walletAddress, resolvedNonce);

      // Log successful verification for audit
      await this.logSignatureVerification(walletAddress, true);

      return true;
    } catch (error) {
      console.error('Signature verification error:', error);
      
      // Log failed verification for audit
      await this.logSignatureVerification(walletAddress, false, error instanceof Error ? error.message : 'Unknown error');
      
      return false;
    }
  }

  private extractNonceFromMessage(message: string): string | null {
    if (!message) return null;
    const match = message.match(/Nonce:\s*([a-f0-9]{64})/i);
    return match?.[1] ?? null;
  }

  // Invalidate nonce (prevent reuse)
  async invalidateNonce(walletAddress: string, nonce?: string): Promise<void> {
    const latestKey = `nonce:${walletAddress}`;

    if (!nonce) {
      await cacheService.delete(latestKey);
      return;
    }

    const cacheKey = `nonce:${walletAddress}:${nonce}`;
    await cacheService.delete(cacheKey);

    const latest = await cacheService.get<{ nonce: string }>(latestKey);
    if (latest?.nonce === nonce) {
      await cacheService.delete(latestKey);
    }
  }

  // Generate JWT token for authenticated user
  generateToken(walletAddress: string, username?: string): string {
    const payload = {
      walletAddress,
      username,
      iat: Math.floor(Date.now() / 1000),
    };

    return sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      algorithm: 'HS256',
    });
  }

  // Verify JWT token
  verifyToken(token: string): {
    walletAddress: string;
    username?: string;
    iat: number;
    exp: number;
  } | null {
    try {
      const decoded = verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as any;

      return {
        walletAddress: decoded.walletAddress,
        username: decoded.username,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Validate wallet address format
  private isValidWalletAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    return this.isSolanaAddress(address) || this.isEthereumAddress(address);
  }

  // Extract wallet address from token
  getWalletAddressFromToken(token: string): string | null {
    const decoded = this.verifyToken(token);
    return decoded?.walletAddress || null;
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    const decoded = this.verifyToken(token);
    if (!decoded) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  }

  // Refresh token (generate new token with same payload)
  refreshToken(oldToken: string): string | null {
    const decoded = this.verifyToken(oldToken);
    if (!decoded) return null;

    return this.generateToken(decoded.walletAddress, decoded.username);
  }

  // Get token expiration time
  getTokenExpiration(token: string): number | null {
    const decoded = this.verifyToken(token);
    return decoded?.exp || null;
  }

  // Verify Solana signature
  private async verifySolanaSignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      // Convert wallet address to PublicKey
      const publicKey = new PublicKey(walletAddress);
      
      // Decode base58 signature
      const signatureBuffer = bs58.decode(signature);
      
      // Convert message to buffer
      const messageBuffer = Buffer.from(message);
      
      // Verify signature using nacl (tweetnacl)
      const verified = nacl.sign.detached.verify(
        messageBuffer,
        signatureBuffer,
        publicKey.toBytes()
      );

      if (!verified) {
        console.warn(`Solana signature verification failed for: ${walletAddress}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Solana signature verification error:', error);
      return false;
    }
  }

  // Verify Ethereum signature
  private async verifyEthereumSignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      // Normalize Ethereum address (checksum)
      const checksumAddress = ethers.getAddress(walletAddress);
      
      // Recover address from signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare recovered address with provided address
      const verified = recoveredAddress.toLowerCase() === checksumAddress.toLowerCase();
      
      if (!verified) {
        console.warn(`Ethereum signature verification failed. Expected: ${checksumAddress}, Got: ${recoveredAddress}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ethereum signature verification error:', error);
      return false;
    }
  }

  // Check if address is a Solana address
  private isSolanaAddress(address: string): boolean {
    try {
      // Solana addresses are base58 encoded 32-byte public keys
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  // Check if address is an Ethereum address
  private isEthereumAddress(address: string): boolean {
    try {
      // Ethereum addresses start with 0x and are 42 characters (0x + 40 hex)
      if (!address.startsWith('0x') || address.length !== 42) {
        return false;
      }
      
      // Try to get checksum address (will throw if invalid)
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  // Log signature verification for audit purposes
  private async logSignatureVerification(
    walletAddress: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const logEntry = {
        walletAddress,
        success,
        error: error || null,
        timestamp: new Date().toISOString(),
        ip: 'N/A', // Would be passed from request context in production
      };

      // Store in Redis for audit trail (TTL: 30 days)
      const auditKey = `audit:signature:${Date.now()}:${walletAddress}`;
      await cacheService.set(auditKey, logEntry, 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Also log to console for development
      if (config.isDevelopment) {
        console.log(`Signature verification ${success ? '✅' : '❌'}:`, {
          walletAddress: walletAddress.slice(0, 8) + '...',
          success,
          timestamp: logEntry.timestamp,
        });
      }
    } catch (logError) {
      console.error('Failed to log signature verification:', logError);
    }
  }

  // Get signature verification audit logs (for admin purposes)
  async getAuditLogs(
    walletAddress?: string,
    limit: number = 100
  ): Promise<any[]> {
    // Note: In production, this would query a proper audit database
    // For now, we'll return a placeholder
    console.warn('Audit log retrieval not fully implemented');
    return [];
  }
}
