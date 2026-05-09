import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  PaymentRequest,
  CreatePaymentRequest,
  RouteQuote,
  RouteQuoteParams,
  Chain,
  Token,
  UsernameAvailability,
  APIError,
} from '@ghost/shared-types';

class GhostAPIClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<APIError>) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  private handleError(error: AxiosError<APIError>): Error {
    if (error.response) {
      // Server responded with error
      const apiError = error.response.data;
      return new Error(apiError?.message || apiError?.error || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Auth endpoints

  async getNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
    const response = await this.client.post<{ nonce: string; message: string }>(
      '/api/auth/nonce',
      { walletAddress }
    );
    return response.data;
  }

  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string,
    nonce?: string
  ): Promise<{ token: string; user: User }> {
    const payload: {
      walletAddress: string;
      signature: string;
      message: string;
      nonce?: string;
    } = { walletAddress, signature, message };

    if (nonce) {
      payload.nonce = nonce;
    }

    const response = await this.client.post<{ token: string; user: User }>(
      '/api/auth/verify',
      payload
    );
    return response.data;
  }

  // User endpoints

  async getUser(username: string): Promise<User> {
    const response = await this.client.get<{ user: User }>(`/api/users/${username}`);
    return response.data.user;
  }

  async checkUsername(username: string): Promise<UsernameAvailability> {
    const response = await this.client.get<UsernameAvailability>(
      `/api/users/username/check/${username}`
    );
    return response.data;
  }

  async registerUsername(username: string): Promise<{ success: boolean; txSignature: string }> {
    const response = await this.client.post<{ success: boolean; txSignature: string }>(
      '/api/users/username/register',
      { username }
    );
    return response.data;
  }

  async resolveUsername(username: string): Promise<{ walletAddress: string }> {
    const response = await this.client.get<{ walletAddress: string }>(
      `/api/users/username/resolve/${username}`
    );
    return response.data;
  }

  // Payment endpoints

  async createPayment(data: CreatePaymentRequest): Promise<PaymentRequest> {
    const response = await this.client.post<PaymentRequest>(
      '/api/payments/create',
      data
    );
    return response.data;
  }

  async getPayment(id: string): Promise<PaymentRequest> {
    const response = await this.client.get<PaymentRequest>(
      `/api/payments/${id}`
    );
    return response.data;
  }

  async getPaymentByUsername(username: string): Promise<PaymentRequest[]> {
    const response = await this.client.get<PaymentRequest[]>(
      `/api/payments/username/${username}`
    );
    return response.data;
  }

  async getPaymentHistory(): Promise<PaymentRequest[]> {
    const response = await this.client.get<{ data: PaymentRequest[] }>(
      `/api/payments/history`
    );
    return response.data.data;
  }

  async cancelPayment(id: string): Promise<{ success: boolean; txSignature: string }> {
    const response = await this.client.post<{ success: boolean; txSignature: string }>(
      `/api/payments/${id}/cancel`
    );
    return response.data;
  }

  async syncPayment(id: string, username: string): Promise<PaymentRequest> {
    const response = await this.client.post<PaymentRequest>(
      `/api/payments/${id}/sync`,
      { username }
    );
    return response.data;
  }

  async getAuditTrail(id: string): Promise<any[]> {
    const response = await this.client.get<any[]>(
      `/api/payments/${id}/audit`
    );
    return response.data;
  }

  // LI.FI endpoints

  async getRouteQuote(params: RouteQuoteParams): Promise<RouteQuote> {
    const response = await this.client.get<RouteQuote>('/api/payments/route', { params });
    return response.data;
  }

  async getSupportedChains(): Promise<Chain[]> {
    // This would call LI.FI API or a cached endpoint
    // For now, return hardcoded supported chains
    return [
      {
        id: 1,
        name: 'Ethereum',
        key: 'ethereum',
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        nativeToken: {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chainId: 1,
        },
      },
      {
        id: 137,
        name: 'Polygon',
        key: 'polygon',
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
        nativeToken: {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'MATIC',
          name: 'Polygon',
          decimals: 18,
          chainId: 137,
        },
      },
      {
        id: 8453,
        name: 'Base',
        key: 'base',
        logoURI: 'https://bridge.base.org/icons/base.svg',
        nativeToken: {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chainId: 8453,
        },
      },
      {
        id: 42161,
        name: 'Arbitrum',
        key: 'arbitrum',
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
        nativeToken: {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chainId: 42161,
        },
      },
    ];
  }

  async getSupportedTokens(chainId: number): Promise<Token[]> {
    // This would call LI.FI API or a cached endpoint
    // For now, return common stablecoins
    const tokens: Record<number, Token[]> = {
      1: [ // Ethereum
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          chainId: 1,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          chainId: 1,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
        },
      ],
      137: [ // Polygon
        {
          address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          chainId: 137,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
      ],
      8453: [ // Base
        {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          chainId: 8453,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
      ],
      42161: [ // Arbitrum
        {
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          chainId: 42161,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
      ],
    };

    return tokens[chainId] || [];
  }
}

// Export singleton instance
export const apiClient = new GhostAPIClient();

// Export class for testing
export { GhostAPIClient };
