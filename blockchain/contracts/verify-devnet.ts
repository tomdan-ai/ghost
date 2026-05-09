import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { GhostRegistry } from "./target/types/ghost_registry";
import fs from "fs";
import idl from "./target/idl/ghost_registry.json";

const PROGRAM_ID = new PublicKey("5v95TCKx8XvdXKnGjFQUumdNwdAuM6prvcYx6YfZxBKH");
const DEVNET_RPC = "https://api.devnet.solana.com";

async function main() {
  console.log("🔍 Verifying Ghost Registry Program on Devnet");
  console.log("=".repeat(50));
  console.log("");

  // Setup connection
  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  // Load wallet
  const keypairPath = `${process.env.HOME}/.config/solana/id.json`;
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  const program = new Program(idl as any, PROGRAM_ID, provider);
  
  console.log("📋 Configuration:");
  console.log(`   Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`   Wallet: ${keypair.publicKey.toBase58()}`);
  console.log(`   RPC: ${DEVNET_RPC}`);
  console.log("");

  // Check wallet balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Wallet Balance: ${balance / 1e9} SOL`);
  console.log("");

  // Verify program exists
  try {
    const programInfo = await connection.getAccountInfo(PROGRAM_ID);
    if (programInfo) {
      console.log("✅ Program account exists");
      console.log(`   Executable: ${programInfo.executable}`);
      console.log(`   Owner: ${programInfo.owner.toBase58()}`);
      console.log("");
    } else {
      console.log("❌ Program account not found");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error fetching program:", error);
    process.exit(1);
  }

  // Test 1: Register a username
  console.log("🧪 Test 1: Register Username");
  const testUsername = `test_${Date.now()}`;
  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), Buffer.from(testUsername)],
    PROGRAM_ID
  );

  try {
    const tx = await program.methods
      .registerUsername(testUsername)
      .accounts({
        registry: registryPda,
        user: keypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`   ✅ Username registered: ${testUsername}`);
    console.log(`   Transaction: ${tx}`);
    console.log(`   Registry PDA: ${registryPda.toBase58()}`);
    
    // Fetch and verify
    const registry = await program.account.usernameRegistry.fetch(registryPda);
    console.log(`   Username: ${registry.username}`);
    console.log(`   Wallet: ${registry.wallet.toBase58()}`);
    console.log("");
  } catch (error: any) {
    console.error(`   ❌ Failed to register username:`, error.message);
    console.log("");
  }

  // Test 2: Create a payment reference
  console.log("🧪 Test 2: Create Payment Reference");
  const paymentId = `payment_${Date.now()}`;
  const [referencePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("payment"), Buffer.from(testUsername), Buffer.from(paymentId)],
    PROGRAM_ID
  );

  try {
    const tx = await program.methods
      .createPaymentReference(paymentId, new anchor.BN(1000000), "ethereum")
      .accounts({
        reference: referencePda,
        registry: registryPda,
        payer: keypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`   ✅ Payment reference created: ${paymentId}`);
    console.log(`   Transaction: ${tx}`);
    console.log(`   Reference PDA: ${referencePda.toBase58()}`);
    
    // Fetch and verify
    const reference = await program.account.paymentReference.fetch(referencePda);
    console.log(`   Payment ID: ${reference.id}`);
    console.log(`   Amount: ${reference.amount.toString()} lamports`);
    console.log(`   Source Chain: ${reference.sourceChain}`);
    console.log(`   Status: ${JSON.stringify(reference.status)}`);
    console.log("");
  } catch (error: any) {
    console.error(`   ❌ Failed to create payment reference:`, error.message);
    console.log("");
  }

  // Test 3: Claim payment reference
  console.log("🧪 Test 3: Claim Payment Reference");
  try {
    const tx = await program.methods
      .claimPaymentReference(paymentId)
      .accounts({
        reference: referencePda,
        registry: registryPda,
        authority: keypair.publicKey,
      })
      .rpc();

    console.log(`   ✅ Payment reference claimed`);
    console.log(`   Transaction: ${tx}`);
    
    // Fetch and verify
    const reference = await program.account.paymentReference.fetch(referencePda);
    console.log(`   Status: ${JSON.stringify(reference.status)}`);
    console.log("");
  } catch (error: any) {
    console.error(`   ❌ Failed to claim payment:`, error.message);
    console.log("");
  }

  // Test 4: Query existing usernames
  console.log("🧪 Test 4: Query All Usernames");
  try {
    const registries = await program.account.usernameRegistry.all();
    console.log(`   Found ${registries.length} registered usernames:`);
    registries.slice(0, 5).forEach((reg) => {
      console.log(`   - ${reg.account.username} → ${reg.account.wallet.toBase58()}`);
    });
    if (registries.length > 5) {
      console.log(`   ... and ${registries.length - 5} more`);
    }
    console.log("");
  } catch (error: any) {
    console.error(`   ❌ Failed to query usernames:`, error.message);
    console.log("");
  }

  console.log("=".repeat(50));
  console.log("✅ Verification Complete!");
  console.log("");
  console.log("🔗 View on Solana Explorer:");
  console.log(`   https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
