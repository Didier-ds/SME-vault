import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { fundWallet } from "./utils/fund-wallet";
import { DEVNET_USDC_MINT, getTokenAccounts } from "./utils/token-setup";

describe("freeze_vault / unfreeze_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmeVault as Program<SmeVault>;

  let vaultPda: PublicKey;
  const vaultName = `Freeze Vault ${Date.now()}`;

  before(async () => {
    const owner = provider.wallet.publicKey;

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer(), Buffer.from(vaultName)],
      program.programId
    );

    const tokenAccounts = getTokenAccounts(vaultPda, DEVNET_USDC_MINT);

    await program.methods
      .createVault(
        vaultName,
        2,
        new anchor.BN(100000),
        new anchor.BN(50000),
        new anchor.BN(25000),
        new anchor.BN(24)
      )
      .accounts({
        vault: vaultPda,
        tokenMint: tokenAccounts.tokenMint,
        vaultTokenAccount: tokenAccounts.vaultTokenAccount,
        owner,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: tokenAccounts.tokenProgram,
        associatedTokenProgram: tokenAccounts.associatedTokenProgram,
      })
      .rpc();
  });

  it("Owner can freeze and unfreeze the vault", async () => {
    const owner = provider.wallet.publicKey;

    await program.methods
      .freezeVault()
      .accounts({
        vault: vaultPda,
        owner,
      })
      .rpc();

    let vault = await program.account.vault.fetch(vaultPda);
    expect(vault.frozen).to.equal(true);

    await program.methods
      .unfreezeVault()
      .accounts({
        vault: vaultPda,
        owner,
      })
      .rpc();

    vault = await program.account.vault.fetch(vaultPda);
    expect(vault.frozen).to.equal(false);
  });

  it("Non-owner cannot freeze or unfreeze the vault", async () => {
    const nonOwner = anchor.web3.Keypair.generate();
    await fundWallet(provider, nonOwner.publicKey, 0.05);

    // Try freeze
    try {
      await program.methods
        .freezeVault()
        .accounts({
          vault: vaultPda,
          owner: nonOwner.publicKey,
        })
        .signers([nonOwner])
        .rpc();

      expect.fail("Should have thrown");
    } catch (err: any) {
      const msg =
        err.error?.errorMessage || err.message || String(err);
      expect(msg).to.include("Unauthorized");
    }

    // Try unfreeze
    try {
      await program.methods
        .unfreezeVault()
        .accounts({
          vault: vaultPda,
          owner: nonOwner.publicKey,
        })
        .signers([nonOwner])
        .rpc();

      expect.fail("Should have thrown");
    } catch (err: any) {
      const msg =
        err.error?.errorMessage || err.message || String(err);
      expect(msg).to.include("Unauthorized");
    }
  });
});

