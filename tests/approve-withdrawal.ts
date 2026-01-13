import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { fundWallet } from "./utils/fund-wallet";
import { PublicKey, Keypair } from "@solana/web3.js";
import { DEVNET_USDC_MINT, getTokenAccounts } from "./utils/token-setup";

describe("approve_withdrawal", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmeVault as Program<SmeVault>;

  let vaultPda: PublicKey;
  let staffMember: Keypair;
  let approver1: Keypair;
  let approver2: Keypair;
  let approver3: Keypair;
  let nonApprover: Keypair;
  let destination: Keypair;
  const vaultName = `Test Vault ${Date.now()}`;

  before(async () => {
    staffMember = Keypair.generate();
    approver1 = Keypair.generate();
    approver2 = Keypair.generate();
    approver3 = Keypair.generate();
    nonApprover = Keypair.generate();
    destination = Keypair.generate();

    // Airdrop SOL to all participants (0.05 SOL is enough for multiple transactions)
    const airdropPromises = [
      staffMember,
      approver1,
      approver2,
      approver3,
      nonApprover,
    ].map(async (keypair) => {
      await fundWallet(provider, keypair.publicKey, 0.05);
    });
    await Promise.all(airdropPromises);

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
        2, // threshold: 2 approvals needed
        new anchor.BN(100000_000000),
        new anchor.BN(10000_000000),
        new anchor.BN(5000_000000),
        new anchor.BN(24)
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

    // Add 3 approvers
    await program.methods
      .addApprover(approver1.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addApprover(approver2.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addApprover(approver3.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
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

  it("Approver can approve pending withdrawal", async () => {
    // Create withdrawal request
    const amount = new anchor.BN(1000_000000);
    const reason = "Test withdrawal";

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

    // Approve with approver1
    await program.methods
      .approveWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        approver: approver1.publicKey,
      })
      .signers([approver1])
      .rpc();

    // Verify approval was recorded
    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );

    expect(withdrawal.approvals.length).to.equal(1);
    expect(withdrawal.approvals[0].toString()).to.equal(
      approver1.publicKey.toString()
    );
    // Status should still be Pending (threshold is 2)
    expect(withdrawal.status).to.deep.equal({ pending: {} });
  });

  it("Status changes to Approved when threshold is met", async () => {
    // Create withdrawal request
    const amount = new anchor.BN(2000_000000);
    const reason = "Threshold test";

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

    // First approval
    await program.methods
      .approveWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        approver: approver1.publicKey,
      })
      .signers([approver1])
      .rpc();

    let withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );
    expect(withdrawal.status).to.deep.equal({ pending: {} });

    // Second approval - should trigger status change
    await program.methods
      .approveWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        approver: approver2.publicKey,
      })
      .signers([approver2])
      .rpc();

    withdrawal = await program.account.withdrawalRequest.fetch(withdrawalPda);
    expect(withdrawal.approvals.length).to.equal(2);
    expect(withdrawal.status).to.deep.equal({ approved: {} });
  });

  it("Fails when non-approver tries to approve", async () => {
    // Create withdrawal request
    const amount = new anchor.BN(1500_000000);
    const reason = "Non-approver test";

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

    // Try to approve with non-approver
    try {
      await program.methods
        .approveWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          approver: nonApprover.publicKey,
        })
        .signers([nonApprover])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Unauthorized");
    }
  });

  it("Fails when approver tries to approve twice", async () => {
    // Create withdrawal request
    const amount = new anchor.BN(1800_000000);
    const reason = "Duplicate test";

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

    // First approval
    await program.methods
      .approveWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        approver: approver1.publicKey,
      })
      .signers([approver1])
      .rpc();

    // Try to approve again with same approver
    try {
      await program.methods
        .approveWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          approver: approver1.publicKey,
        })
        .signers([approver1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Already approved");
    }
  });

  it("Fails when requester tries to approve their own request", async () => {
    // Add staffMember as approver (so they can be both staff and approver)
    await program.methods
      .addApprover(staffMember.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Create withdrawal request as staffMember
    const amount = new anchor.BN(2500_000000);
    const reason = "Self-approval test";

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

    // Try to approve own request
    try {
      await program.methods
        .approveWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          approver: staffMember.publicKey,
        })
        .signers([staffMember])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Self-approval not allowed");
    }
  });

  it("Fails when trying to approve non-pending withdrawal", async () => {
    // Create and fully approve a withdrawal
    const amount = new anchor.BN(3000_000000);
    const reason = "Already approved test";

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

    // Get 2 approvals to change status to Approved
    await program.methods
      .approveWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        approver: approver1.publicKey,
      })
      .signers([approver1])
      .rpc();

    await program.methods
      .approveWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        approver: approver2.publicKey,
      })
      .signers([approver2])
      .rpc();

    // Verify status is Approved
    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );
    expect(withdrawal.status).to.deep.equal({ approved: {} });

    // Try to approve again with approver3
    try {
      await program.methods
        .approveWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          approver: approver3.publicKey,
        })
        .signers([approver3])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Invalid status");
    }
  });
});
