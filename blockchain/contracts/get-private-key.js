const fs = require('fs');
const bs58 = require('bs58');
const path = require('path');

const keypairPath = path.join(process.env.HOME, '.config/solana/id.json');
const keypair = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const privateKey = bs58.encode(Buffer.from(keypair));

console.log('\n📋 Your Solana Private Key (base58):');
console.log('---');
console.log(privateKey);
console.log('---');
console.log('\n📝 Add this to apps/api/.env:');
console.log(`SOLANA_PAYER_PRIVATE_KEY=${privateKey}`);
console.log('');
