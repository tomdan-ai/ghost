import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { GhostRegistry } from '../target/types/ghost_registry';
import { expect } from 'chai';

describe('ghost_registry', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GhostRegistry as Program<GhostRegistry>;
  const username = 'testuser';

  it('Registers a username', async () => {
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('registry'), Buffer.from(username)],
      program.programId
    );

    await program.methods
      .registerUsername(username)
      .accounts({
        registry: registryPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const registry = await program.account.usernameRegistry.fetch(registryPda);
    
    expect(registry.username).to.equal(username);
    expect(registry.wallet.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  it('Updates wallet address', async () => {
    const newWallet = anchor.web3.Keypair.generate();
    
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('registry'), Buffer.from(username)],
      program.programId
    );

    await program.methods
      .updateWallet()
      .accounts({
        registry: registryPda,
        wallet: provider.wallet.publicKey,
        newWallet: newWallet.publicKey,
      })
      .rpc();

    const registry = await program.account.usernameRegistry.fetch(registryPda);
    
    expect(registry.wallet.toString()).to.equal(newWallet.publicKey.toString());
  });
});
