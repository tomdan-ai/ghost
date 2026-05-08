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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE username_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for payment_requests
CREATE POLICY "Payment requests are viewable by sender and receiver" ON payment_requests
  FOR SELECT USING (
    sender_wallet IN (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text)
    OR receiver_wallet IN (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text)
  );

CREATE POLICY "Anyone can create payment requests" ON payment_requests
  FOR INSERT WITH CHECK (true);

-- RLS Policies for username_registry
CREATE POLICY "Username registry is viewable by everyone" ON username_registry
  FOR SELECT USING (true);

CREATE POLICY "Users can register their own username" ON username_registry
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
