import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NexusTreasury } from "../target/types/nexus_treasury";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

describe("execute_withdrawal", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NexusTreasury as Program<NexusTreasury>;

  let vaultPda: PublicKey;
  let staffMember: Keypair;
  let approver1: Keypair;
  let approver2: Keypair;
  let executor: Keypair;
  let destination: Keypair;
  let mint: PublicKey;
  let vaultTokenAccount: PublicKey;
  let destinationTokenAccount: PublicKey;
  const vaultName = `Test Vault ${Date.now()}`;

  before(async () => {
    staffMember = Keypair.generate();
    approver1 = Keypair.generate();
    approver2 = Keypair.generate();
    executor = Keypair.generate();
    destination = Keypair.generate();

    // Airdrop SOL to all participants
    const airdropPromises = [
      staffMember,
      approver1,
      approver2,
      executor,
      destination,
    ].map(async (keypair) => {
      const signature = await provider.connection.requestAirdrop(
        keypair.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    });
    await Promise.all(airdropPromises);

    // Create SPL Token Mint
    mint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6 // 6 decimals (like USDC)
    );

    // Create vault PDA
    [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(vaultName),
      ],
      program.programId
    );

    // Create vault
    await program.methods
      .createVault(
        vaultName,
        2, // threshold: 2 approvals needed
        new anchor.BN(100000_000000),
        new anchor.BN(10000_000000),
        new anchor.BN(5000_000000),
        new anchor.BN(24) // 24 hour delay
      )
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Create token account for vault PDA (use getOrCreateAssociatedTokenAccount with allowOwnerOffCurve)
    const vaultTokenAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      vaultPda, // Owner is the vault PDA
      true // allowOwnerOffCurve - required for PDAs
    );
    vaultTokenAccount = vaultTokenAccountInfo.address;

    // Create token account for destination
    destinationTokenAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      destination.publicKey
    );

    // Mint 100,000 tokens to vault
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      vaultTokenAccount,
      provider.wallet.publicKey,
      100000_000000 // 100k tokens
    );

    // Add approvers
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

    // Add staff member
    await program.methods
      .addStaff(staffMember.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Successfully executes approved withdrawal with token transfer", async () => {
    const amount = new anchor.BN(1000_000000); // 1000 tokens
    const reason = "Execute test";

    // Create withdrawal request
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
      .requestWithdrawal(amount, destinationTokenAccount, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    // Get 2 approvals
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

    // Get balances before
    const vaultBalanceBefore = (
      await getAccount(provider.connection, vaultTokenAccount)
    ).amount;
    const destBalanceBefore = (
      await getAccount(provider.connection, destinationTokenAccount)
    ).amount;

    // Execute withdrawal
    await program.methods
      .executeWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        destinationTokenAccount: destinationTokenAccount,
        vaultAuthority: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        executor: executor.publicKey,
      })
      .signers([executor])
      .rpc();

    // Verify withdrawal status
    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );
    expect(withdrawal.status).to.deep.equal({ executed: {} });
    expect(withdrawal.executedAt).to.not.be.null;

    // Verify token transfer
    const vaultBalanceAfter = (
      await getAccount(provider.connection, vaultTokenAccount)
    ).amount;
    const destBalanceAfter = (
      await getAccount(provider.connection, destinationTokenAccount)
    ).amount;

    expect(Number(vaultBalanceAfter)).to.equal(
      Number(vaultBalanceBefore) - 1000_000000
    );
    expect(Number(destBalanceAfter)).to.equal(
      Number(destBalanceBefore) + 1000_000000
    );
  });

  it("Fails when withdrawal is not approved", async () => {
    const amount = new anchor.BN(2000_000000);
    const reason = "Not approved test";

    // Create withdrawal request (but don't approve it)
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
      .requestWithdrawal(amount, destinationTokenAccount, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    // Try to execute without approval
    try {
      await program.methods
        .executeWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          vaultAuthority: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          executor: executor.publicKey,
        })
        .signers([executor])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Invalid status");
    }
  });

  it("Fails when time delay has not passed", async () => {
    const amount = new anchor.BN(6000_000000); // Large withdrawal (> 5k threshold)
    const reason = "Delay test";

    // Create large withdrawal request (will have delay)
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
      .requestWithdrawal(amount, destinationTokenAccount, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    // Get 2 approvals
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

    // Verify delay is set
    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );
    expect(withdrawal.delayUntil).to.not.be.null;

    // Try to execute immediately (delay hasn't passed)
    try {
      await program.methods
        .executeWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          vaultAuthority: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          executor: executor.publicKey,
        })
        .signers([executor])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Delay not passed");
    }
  });

  it("Fails when vault has insufficient balance", async () => {
    // First, drain the vault by executing multiple withdrawals
    // Vault started with 100k, already withdrew 1k in test 1, so 99k left
    // Execute withdrawals of 4k each (below 5k threshold = no delay)
    // Do 24 withdrawals of 4k = 96k, leaving ~3k in vault

    for (let i = 0; i < 24; i++) {
      const drainAmount = new anchor.BN(4000_000000); // 4k each (below large_withdrawal_threshold)
      const drainReason = `Drain ${i + 1}`;

      let vault = await program.account.vault.fetch(vaultPda);
      const requestId = vault.withdrawalCount;

      const [drainWithdrawalPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("withdrawal"),
          vaultPda.toBuffer(),
          requestId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .requestWithdrawal(drainAmount, destinationTokenAccount, drainReason)
        .accounts({
          withdrawal: drainWithdrawalPda,
          vault: vaultPda,
          requester: staffMember.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([staffMember])
        .rpc();

      // Approve
      await program.methods
        .approveWithdrawal()
        .accounts({
          withdrawal: drainWithdrawalPda,
          vault: vaultPda,
          approver: approver1.publicKey,
        })
        .signers([approver1])
        .rpc();

      await program.methods
        .approveWithdrawal()
        .accounts({
          withdrawal: drainWithdrawalPda,
          vault: vaultPda,
          approver: approver2.publicKey,
        })
        .signers([approver2])
        .rpc();

      // Execute
      await program.methods
        .executeWithdrawal()
        .accounts({
          withdrawal: drainWithdrawalPda,
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          vaultAuthority: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          executor: executor.publicKey,
        })
        .signers([executor])
        .rpc();
    }

    // Now vault has ~3k left (99k - 96k)
    // Try to request and execute 4k withdrawal - should fail (4k > 3k remaining, but < 5k threshold so no delay)
    const amount = new anchor.BN(4000_000000); // 4k > 3k remaining
    const reason = "Insufficient balance test";

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
      .requestWithdrawal(amount, destinationTokenAccount, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    // Get 2 approvals
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

    // Try to execute (should fail due to insufficient balance)
    try {
      await program.methods
        .executeWithdrawal()
        .accounts({
          withdrawal: withdrawalPda,
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          vaultAuthority: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          executor: executor.publicKey,
        })
        .signers([executor])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.error.errorMessage).to.include("Insufficient balance");
    }
  });

  it("Anyone can execute an approved withdrawal (permissionless)", async () => {
    const amount = new anchor.BN(500_000000);
    const reason = "Permissionless execution test";

    // Create withdrawal request
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
      .requestWithdrawal(amount, destinationTokenAccount, reason)
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        requester: staffMember.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([staffMember])
      .rpc();

    // Get 2 approvals
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

    // Execute with a random person (not staff, not approver)
    const randomExecutor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      randomExecutor.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    await program.methods
      .executeWithdrawal()
      .accounts({
        withdrawal: withdrawalPda,
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        destinationTokenAccount: destinationTokenAccount,
        vaultAuthority: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        executor: randomExecutor.publicKey,
      })
      .signers([randomExecutor])
      .rpc();

    // Verify execution succeeded
    const withdrawal = await program.account.withdrawalRequest.fetch(
      withdrawalPda
    );
    expect(withdrawal.status).to.deep.equal({ executed: {} });
  });
});
