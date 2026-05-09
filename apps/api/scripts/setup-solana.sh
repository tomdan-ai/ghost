#!/bin/bash

echo "🔧 Setting up Solana configuration..."

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Generate keypair if it doesn't exist
KEYPAIR_PATH="$HOME/.config/solana/ghost-api-payer.json"

if [ -f "$KEYPAIR_PATH" ]; then
    echo "✅ Keypair already exists at $KEYPAIR_PATH"
else
    echo "🔑 Generating new keypair..."
    solana-keygen new --no-bip39-passphrase -o "$KEYPAIR_PATH"
fi

# Export private key as base58
echo ""
echo "📋 Your Solana payer private key (base58):"
echo "---"
solana-keygen export "$KEYPAIR_PATH" | tail -1
echo "---"
echo ""
echo "📝 Add this to your .env file as:"
echo "SOLANA_PAYER_PRIVATE_KEY=<the_key_above>"
echo ""
echo "💰 Public key:"
solana-keygen pubkey "$KEYPAIR_PATH"
echo ""
echo "⚠️  For local development, make sure to:"
echo "   1. Start solana-test-validator"
echo "   2. Airdrop SOL: solana airdrop 10 \$(solana-keygen pubkey $KEYPAIR_PATH) --url localhost"
