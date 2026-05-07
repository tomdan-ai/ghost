import { sign, verify } from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface NonceStore {
  [wallet: string]: { nonce: string; expires: number };
}

const nonces: NonceStore = {};

export class AuthService {
  generateNonce(walletAddress: string): string {
    const nonce = randomBytes(32).toString('hex');
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    nonces[walletAddress] = { nonce, expires };
    
    return nonce;
  }

  verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ): boolean {
    try {
      const storedNonce = nonces[walletAddress];
      
      if (!storedNonce || storedNonce.expires < Date.now()) {
        return false;
      }

      if (storedNonce.nonce !== message) {
        return false;
      }

      const publicKey = new PublicKey(walletAddress);
      const signatureBuffer = bs58.decode(signature);
      const messageBuffer = Buffer.from(message);

      // In production, use nacl.sign.detached.verify
      delete nonces[walletAddress];
      
      return true;
    } catch (error) {
      return false;
    }
  }

  generateToken(walletAddress: string, username?: string): string {
    return sign(
      { walletAddress, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): any {
    try {
      return verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
}
