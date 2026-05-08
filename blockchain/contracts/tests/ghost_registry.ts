import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GhostRegistry } from "../target/types/ghost_registry";
import { expect } from "chai";

describe("ghost_registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GhostRegistry as Program<GhostRegistry>;
  const user = provider.wallet;

  describe("Username Registry", () => {
    const username = "alice";

    it("Registers a username", async () => {
      const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(username)],
        program.programId
      );

      await program.methods
        .registerUsername(username)
        .accounts({
          registry: registryPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const registry = await program.account.usernameRegistry.fetch(registryPda);
      expect(registry.username).to.equal(username);
      expect(registry.wallet.toString()).to.equal(user.publicKey.toString());
    });

    it("Fails to register username that's too short", async () => {
      const shortUsername = "ab";
      const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(shortUsername)],
        program.programId
      );

      try {
        await program.methods
          .registerUsername(shortUsername)
          .accounts({
            registry: registryPda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have failed");
      } catch (err) {
        expect(err.message).to.include("UsernameTooShort");
      }
    });

    it("Updates wallet address", async () => {
      const newWallet = anchor.web3.Keypair.generate();
      const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(username)],
        program.programId
      );

      await program.methods
        .updateWallet()
        .accounts({
          registry: registryPda,
          wallet: user.publicKey,
          newWallet: newWallet.publicKey,
        })
        .rpc();

      const registry = await program.account.usernameRegistry.fetch(registryPda);
      expect(registry.wallet.toString()).to.equal(newWallet.publicKey.toString());
    });
  });

  describe("Payment References", () => {
    const username = "bob";
    const paymentId = "payment_123";

    before(async () => {
      const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(username)],
        program.programId
      );

      try {
        await program.methods
          .registerUsername(username)
          .accounts({
            registry: registryPda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
      } catch (err) {
        // Username might already exist
      }
    });

    it("Creates a payment reference", async () => {
      const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(username)],
        program.programId
      );

      const [referencePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), Buffer.from(username), Buffer.from(paymentId)],
        program.programId
      );

      await program.methods
        .createPaymentReference(paymentId, new anchor.BN(1000000), "ethereum")
        .accounts({
          reference: referencePda,
          registry: registryPda,
          payer: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const reference = await program.account.paymentReference.fetch(referencePda);
      expect(reference.id).to.equal(paymentId);
      expect(reference.amount.toNumber()).to.equal(1000000);
      expect(reference.sourceChain).to.equal("ethereum");
    });

    it("Claims a payment reference", async () => {
      const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(username)],
        program.programId
      );

      const [referencePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), Buffer.from(username), Buffer.from(paymentId)],
        program.programId
      );

      await program.methods
        .claimPaymentReference(paymentId)
        .accounts({
          reference: referencePda,
          registry: registryPda,
          authority: user.publicKey,
        })
        .rpc();

      const reference = await program.account.paymentReference.fetch(referencePda);
      expect(reference.status).to.deep.equal({ claimed: {} });
    });
  });
});
