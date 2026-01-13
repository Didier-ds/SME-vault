import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { fundWallet } from "./utils/fund-wallet";
import { PublicKey, Keypair } from "@solana/web3.js";
import { DEVNET_USDC_MINT, getTokenAccounts } from "./utils/token-setup";

describe("request_withdrawal", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmeVault as Program<SmeVault>;

  let vaultPda: PublicKey;
  let staffMember: Keypair;
  let nonStaff: Keypair;
  let destination: Keypair;
  const vaultName = `Test Vault ${Date.now()}`;

  before(async () => {
    staffMember = Keypair.generate();
    nonStaff = Keypair.generate();
    destination = Keypair.generate();

    // Fund test wallets from provider wallet (need extra for rent + transfers)
    await fundWallet(provider, staffMember.publicKey, 0.2);
    await fundWallet(provider, nonStaff.publicKey, 0.2);

    // Create vault
    [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(vaultName),
      ],
      program.programId
    );

    const tokenAccounts = getTokenAccounts(vaultPda, DEVNET_USDC_MINT);

    await program.methods
      .createVault(
        vaultName,
        2, // threshold
        new anchor.BN(100000_000000), // daily limit: 100k USDC
        new anchor.BN(10000_000000), // tx limit: 10k USDC
        new anchor.BN(5000_000000), // large withdrawal: 5k USDC
        new anchor.BN(24) // 24 hour delay
      )
      .accounts({
        vault: vaultPda,
        tokenMint: tokenAccounts.tokenMint,
        vaultTokenAccount: tokenAccounts.vaultTokenAccount,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: tokenAccounts.tokenProgram,
        associatedTokenProgram: tokenAccounts.associatedTokenProgram,
      })
      .rpc();

    // Add staff member
    await program.methods
      .addStaff(staffMember.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Staff member can request withdrawal", async () => {
    const amount = new anchor.BN(1000_000000); // 1000 USDC
    const reason = "Payment for office supplies";

    // Get current counter
    let vault = await program.account.vault.fetch(vaultPda);
    const requestId = vault.withdrawalCount;

    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("withdrawal"),
        vaultPda.toBuffer(),
        requestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .requestWithdrawal(amount, destination.publicKey, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    // Verify withdrawal was created correctly
    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );

    expect(withdrawal.vault.toString()).to.equal(vaultPda.toString());
    expect(withdrawal.amount.toString()).to.equal(amount.toString());
    expect(withdrawal.destination.toString()).to.equal(
      destination.publicKey.toString()
    );
    expect(withdrawal.requester.toString()).to.equal(
      staffMember.publicKey.toString()
    );
    expect(withdrawal.reason).to.equal(reason);
    expect(withdrawal.approvals.length).to.equal(0);
    expect(withdrawal.status).to.deep.equal({ pending: {} });
    expect(withdrawal.delayUntil).to.be.null; // Amount < large_withdrawal_threshold

    // Verify counter incremented
    vault = await program.account.vault.fetch(vaultPda);
    expect(vault.withdrawalCount.toNumber()).to.equal(1);
  });

  it("Fails when non-staff tries to request withdrawal", async () => {
    const amount = new anchor.BN(1000_000000);
    const reason = "Unauthorized request";

    let vault = await program.account.vault.fetch(vaultPda);
    const requestId = vault.withdrawalCount;

    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("withdrawal"),
        vaultPda.toBuffer(),
        requestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .requestWithdrawal(amount, destination.publicKey, reason)
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          requester: nonStaff.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([nonStaff])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Unauthorized");
    }
  });

  it("Fails when amount is zero", async () => {
    const amount = new anchor.BN(0); // Zero amount
    const reason = "Invalid amount";

    let vault = await program.account.vault.fetch(vaultPda);
    const requestId = vault.withdrawalCount;

    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("withdrawal"),
        vaultPda.toBuffer(),
        requestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .requestWithdrawal(amount, destination.publicKey, reason)
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          requester: staffMember.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([staffMember])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Invalid limit");
    }
  });

  it("Fails when amount exceeds tx_limit", async () => {
    const amount = new anchor.BN(15000_000000); // 15k USDC (> tx_limit of 10k)
    const reason = "Exceeds limit";

    let vault = await program.account.vault.fetch(vaultPda);
    const requestId = vault.withdrawalCount;

    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("withdrawal"),
        vaultPda.toBuffer(),
        requestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .requestWithdrawal(amount, destination.publicKey, reason)
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          requester: staffMember.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([staffMember])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Exceeds limit");
    }
  });

  it("Sets delay_until for large withdrawals", async () => {
    const amount = new anchor.BN(7000_000000); // 7k USDC (> large_withdrawal_threshold of 5k)
    const reason = "Large payment";

    let vault = await program.account.vault.fetch(vaultPda);
    const requestId = vault.withdrawalCount;

    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("withdrawal"),
        vaultPda.toBuffer(),
        requestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const txBefore = Date.now();

    await program.methods
      .requestWithdrawal(amount, destination.publicKey, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );

    // Should have delay_until set
    expect(withdrawal.delayUntil).to.not.be.null;

    // Delay should be approximately 24 hours from now
    const delayUntil = withdrawal.delayUntil.toNumber();
    const expectedDelay = Math.floor(txBefore / 1000) + 24 * 3600;

    // Allow 10 second variance
    expect(delayUntil).to.be.closeTo(expectedDelay, 10);
  });

  it("No delay for small withdrawals", async () => {
    const amount = new anchor.BN(3000_000000); // 3k USDC (< large_withdrawal_threshold)
    const reason = "Small payment";

    let vault = await program.account.vault.fetch(vaultPda);
    const requestId = vault.withdrawalCount;

    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("withdrawal"),
        vaultPda.toBuffer(),
        requestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .requestWithdrawal(amount, destination.publicKey, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );

    // Should NOT have delay
    expect(withdrawal.delayUntil).to.be.null;
  });
});
