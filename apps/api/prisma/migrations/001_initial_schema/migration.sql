-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create username_registry table
CREATE TABLE username_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_requests table
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_wallet TEXT NOT NULL,
  receiver_wallet TEXT NOT NULL,
  amount TEXT NOT NULL,
  source_chain TEXT NOT NULL,
  destination_chain TEXT NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,
  source_tx TEXT,
  destination_tx TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_username_registry_username ON username_registry(username);
CREATE INDEX idx_payment_requests_sender ON payment_requests(sender_wallet);
CREATE INDEX idx_payment_requests_receiver ON payment_requests(receiver_wallet);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_transactions_payment_request ON transactions(payment_request_id);