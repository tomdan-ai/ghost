const fs = require('fs');
const path = require('path');

// Simple base58 encoding without external dependencies
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer) {
  let num = BigInt('0x' + buffer.toString('hex'));
  let encoded = '';
  
  while (num > 0n) {
    const remainder = num % 58n;
    num = num / 58n;
    encoded = ALPHABET[Number(remainder)] + encoded;
  }
  
  // Add '1' for each leading zero byte
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    encoded = '1' + encoded;
  }
  
  return encoded;
}

const keypairPath = path.join(process.env.HOME, '.config/solana/id.json');
const keypair = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const privateKey = base58Encode(Buffer.from(keypair));

console.log('\n📋 Your Solana Private Key (base58):');
console.log('---');
console.log(privateKey);
console.log('---');
console.log('\n📝 Add this to apps/api/.env:');
console.log(`SOLANA_PAYER_PRIVATE_KEY=${privateKey}`);
console.log('');
