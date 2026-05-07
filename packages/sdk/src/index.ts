import axios, { AxiosInstance } from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { User, PaymentRequest, PaymentRoute } from '@ghost/shared-types';

export class GhostSDK {
  private api: AxiosInstance;
  private connection: Connection;

  constructor(apiUrl: string, rpcUrl: string) {
    this.api = axios.create({
      baseURL: apiUrl,
      headers: { 'Content-Type': 'application/json' },
    });

    this.connection = new Connection(rpcUrl);
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async checkUsername(username: string): Promise<boolean> {
    const { data } = await this.api.get(`/username/check/${username}`);
    return data.available;
  }

  async resolveUsername(username: string): Promise<string> {
    const { data } = await this.api.get(`/username/resolve/${username}`);
    return data.walletAddress;
  }

  async registerUsername(username: string): Promise<any> {
    const { data } = await this.api.post('/username/register', { username });
    return data;
  }

  async createPayment(params: {
    receiverWallet: string;
    amount: string;
    sourceChain: string;
    destinationChain: string;
  }): Promise<PaymentRequest> {
    const { data } = await this.api.post('/payment/create', params);
    return data;
  }

  async getPaymentRoute(params: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
  }): Promise<PaymentRoute> {
    const { data } = await this.api.get('/payment/route', { params });
    return data;
  }

  async getPaymentHistory(): Promise<PaymentRequest[]> {
    const { data } = await this.api.get('/payment/history');
    return data;
  }

  async getBalance(address: string): Promise<number> {
    const publicKey = new PublicKey(address);
    const balance = await this.connection.getBalance(publicKey);
    return balance / 1e9;
  }
}

export * from '@ghost/shared-types';
