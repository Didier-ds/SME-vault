import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { fundWallet } from "./utils/fund-wallet";
import { DEVNET_USDC_MINT, getTokenAccounts } from "./utils/token-setup";

describe("update_approval_threshold", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.smeVault as Program<SmeVault>;
  const provider = anchor.AnchorProvider.env();

  let vaultPda: PublicKey;
  let owner: PublicKey;
  let approver1: Keypair;
  let approver2: Keypair;
  let approver3: Keypair;
  let nonOwner: Keypair;
  const vaultName = `Thr-${Date.now()}`;

  before(async () => {
    owner = provider.wallet.publicKey;
    approver1 = Keypair.generate();
    approver2 = Keypair.generate();
    approver3 = Keypair.generate();
    nonOwner = Keypair.generate();

    await fundWallet(provider, approver1.publicKey, 0.05);
    await fundWallet(provider, approver2.publicKey, 0.05);
    await fundWallet(provider, approver3.publicKey, 0.05);
    await fundWallet(provider, nonOwner.publicKey, 0.05);

    // Create vault with threshold 2, add 3 approvers
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer(), Buffer.from(vaultName)],
      program.programId
    );

    const tokenAccounts = getTokenAccounts(vaultPda, DEVNET_USDC_MINT);

    await program.methods
      .createVault(
        vaultName,
        2, // initial threshold
        new anchor.BN(100000_000000),
        new anchor.BN(10000_000000),
        new anchor.BN(5000_000000),
        new anchor.BN(24)
      )
      .accounts({
        vault: vaultPda,
        tokenMint: tokenAccounts.tokenMint,
        vaultTokenAccount: tokenAccounts.vaultTokenAccount,
        owner: owner,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: tokenAccounts.tokenProgram,
        associatedTokenProgram: tokenAccounts.associatedTokenProgram,
      })
      .rpc();

    // Add 3 approvers
    await program.methods.addApprover(approver1.publicKey).accounts({ vault: vaultPda, owner }).rpc();
    await program.methods.addApprover(approver2.publicKey).accounts({ vault: vaultPda, owner }).rpc();
    await program.methods.addApprover(approver3.publicKey).accounts({ vault: vaultPda, owner }).rpc();
  });

  it("Owner can update approval threshold", async () => {
    await program.methods
      .updateApprovalThreshold(3)
      .accounts({ vault: vaultPda, owner })
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.approvalThreshold).to.equal(3);

    // Change back to 2
    await program.methods
      .updateApprovalThreshold(2)
      .accounts({ vault: vaultPda, owner })
      .rpc();

    const vaultAfter = await program.account.vault.fetch(vaultPda);
    expect(vaultAfter.approvalThreshold).to.equal(2);
  });

  it("Owner can set threshold to 1 when multiple approvers exist", async () => {
    await program.methods
      .updateApprovalThreshold(1)
      .accounts({ vault: vaultPda, owner })
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.approvalThreshold).to.equal(1);
  });

  it("Fails when non-owner tries to update threshold", async () => {
    try {
      await program.methods
        .updateApprovalThreshold(2)
        .accounts({ vault: vaultPda, owner: nonOwner.publicKey })
        .signers([nonOwner])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      const error = err as { error?: { errorMessage?: string } };
      expect(error.error?.errorMessage).to.include("Unauthorized");
    }
  });

  it("Fails when new threshold is zero", async () => {
    try {
      await program.methods
        .updateApprovalThreshold(0)
        .accounts({ vault: vaultPda, owner })
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      const error = err as { error?: { errorMessage?: string } };
      expect(error.error?.errorMessage).to.include("Invalid threshold");
    }
  });

  it("Fails when new threshold exceeds number of approvers", async () => {
    // We have 3 approvers; threshold 4 is invalid
    try {
      await program.methods
        .updateApprovalThreshold(4)
        .accounts({ vault: vaultPda, owner })
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      const error = err as { error?: { errorMessage?: string } };
      expect(error.error?.errorMessage).to.include("Invalid threshold");
    }
  });
});
