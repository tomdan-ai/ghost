export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          username: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string
          created_at?: string
        }
      }
      username_registry: {
        Row: {
          id: string
          username: string
          wallet_address: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          wallet_address: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          wallet_address?: string
          user_id?: string
          created_at?: string
        }
      }
      payment_requests: {
        Row: {
          id: string
          sender_wallet: string
          receiver_wallet: string
          amount: string
          source_chain: string
          destination_chain: string
          status: string
          tx_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_wallet: string
          receiver_wallet: string
          amount: string
          source_chain: string
          destination_chain: string
          status: string
          tx_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_wallet?: string
          receiver_wallet?: string
          amount?: string
          source_chain?: string
          destination_chain?: string
          status?: string
          tx_hash?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          payment_request_id: string
          source_tx: string | null
          destination_tx: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          payment_request_id: string
          source_tx?: string | null
          destination_tx?: string | null
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          payment_request_id?: string
          source_tx?: string | null
          destination_tx?: string | null
          status?: string
          created_at?: string
        }
      }
    }
  }
}
