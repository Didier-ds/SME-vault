import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("remove_approver", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmeVault as Program<SmeVault>;

  // 🔍 HELPER FUNCTION: Show msg!() logs from Rust
  async function showLogs(signature: string, label: string = "Transaction") {
    // Wait a bit for transaction to be confirmed
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tx = await provider.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",  // Use confirmed commitment level
    });

    console.log(`\n📋 ${label} Logs:`);
    console.log("================================");
    if (tx?.meta?.logMessages) {
      tx.meta.logMessages.forEach(log => {
        if (log.includes("Program log:")) {
          // Remove "Program log: " prefix for cleaner output
          console.log("  " + log.replace("Program log: ", ""));
        }
      });
    }
    console.log("================================\n");
  }

  let vaultPda: PublicKey;
  let approver1: Keypair;
  let approver2: Keypair;
  let approver3: Keypair;
  const vaultName = `Test Vault ${Date.now()}`;

  before(async () => {
    // Create test approvers
    approver1 = Keypair.generate();
    approver2 = Keypair.generate();
    approver3 = Keypair.generate();

    // Derive vault PDA
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
        2, // threshold: 2 of 3
        new anchor.BN(10000_000000), // daily limit
        new anchor.BN(5000_000000),  // tx limit
        new anchor.BN(3000_000000),  // large withdrawal threshold
        new anchor.BN(24)            // delay hours
      )
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add 3 approvers to start
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
  });

  it("Successfully removes an approver", async () => {
    // Verify approver3 exists before removal
    let vault = await program.account.vault.fetch(vaultPda);
    expect(vault.approvers.length).to.equal(3);
    expect(
      vault.approvers.some((a) => a.equals(approver3.publicKey))
    ).to.be.true;

    // Remove approver3
    const tx = await program.methods
      .removeApprover(approver3.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // 🔍 Show the msg!() logs from your Rust code
    await showLogs(tx, "REMOVE_APPROVER");

    // Verify approver3 was removed
    vault = await program.account.vault.fetch(vaultPda);
    expect(vault.approvers.length).to.equal(2);
    expect(
      vault.approvers.some((a) => a.equals(approver3.publicKey))
    ).to.be.false;

    // Verify approver1 and approver2 still exist
    expect(
      vault.approvers.some((a) => a.equals(approver1.publicKey))
    ).to.be.true;
    expect(
      vault.approvers.some((a) => a.equals(approver2.publicKey))
    ).to.be.true;
  });

  it("Fails when non-owner tries to remove approver", async () => {
    const nonOwner = Keypair.generate();

    // Airdrop SOL to non-owner for transaction fees
    const signature = await provider.connection.requestAirdrop(
      nonOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    try {
      await program.methods
        .removeApprover(approver1.publicKey)
        .accounts({
          vault: vaultPda,
          owner: nonOwner.publicKey,
        })
        .signers([nonOwner])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      // Should fail with Unauthorized or constraint violation
      expect(error).to.exist;
    }
  });

  it("Fails when trying to remove non-existent approver", async () => {
    const nonExistentApprover = Keypair.generate();

    try {
      await program.methods
        .removeApprover(nonExistentApprover.publicKey)
        .accounts({
          vault: vaultPda,
          owner: provider.wallet.publicKey,
        })
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      // Should fail with ApproverNotFound or similar error
      expect(error).to.exist;
      // You can add more specific error checking here once you define the error
      // expect(error.error.errorCode.code).to.equal("ApproverNotFound");
    }
  });

  it("Fails when removal would make threshold impossible", async () => {
    // Current state: 2 approvers (approver1, approver2), threshold = 2
    // Trying to remove one would make threshold impossible (2-of-1)

    try {
      await program.methods
        .removeApprover(approver1.publicKey)
        .accounts({
          vault: vaultPda,
          owner: provider.wallet.publicKey,
        })
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      // Should fail with InvalidThreshold or similar error
      expect(error).to.exist;
      // You can add more specific error checking here
      // expect(error.error.errorCode.code).to.equal("InvalidThreshold");
    }

    // Verify approver was NOT removed
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.approvers.length).to.equal(2);
    expect(
      vault.approvers.some((a) => a.equals(approver1.publicKey))
    ).to.be.true;
  });

  it("Allows removal when threshold would still be valid", async () => {
    // Lower the threshold first to make removal possible
    // This assumes you have an update_threshold instruction
    // If not, skip this test or create a new vault with threshold = 1

    // For now, let's create a fresh vault with threshold = 1
    const newVaultName = `Test Vault ${Date.now()}`;
    const [newVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(newVaultName),
      ],
      program.programId
    );

    // Create vault with threshold = 1
    await program.methods
      .createVault(
        newVaultName,
        1, // threshold: 1 of 3
        new anchor.BN(10000_000000),
        new anchor.BN(5000_000000),
        new anchor.BN(3000_000000),
        new anchor.BN(24)
      )
      .accounts({
        vault: newVaultPda,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add 3 approvers
    const newApprover1 = Keypair.generate();
    const newApprover2 = Keypair.generate();
    const newApprover3 = Keypair.generate();

    await program.methods
      .addApprover(newApprover1.publicKey)
      .accounts({
        vault: newVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addApprover(newApprover2.publicKey)
      .accounts({
        vault: newVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addApprover(newApprover3.publicKey)
      .accounts({
        vault: newVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Now remove one - should succeed because threshold is 1
    await program.methods
      .removeApprover(newApprover3.publicKey)
      .accounts({
        vault: newVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify removal
    const vault = await program.account.vault.fetch(newVaultPda);
    expect(vault.approvers.length).to.equal(2);
    expect(
      vault.approvers.some((a) => a.equals(newApprover3.publicKey))
    ).to.be.false;
  });

  it("Maintains data integrity after removal", async () => {
    // Create a fresh vault for this test
    const freshVaultName = `Test Vault ${Date.now()}`;
    const [freshVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(freshVaultName),
      ],
      program.programId
    );

    await program.methods
      .createVault(
        freshVaultName,
        1,
        new anchor.BN(10000_000000),
        new anchor.BN(5000_000000),
        new anchor.BN(3000_000000),
        new anchor.BN(24)
      )
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const testApprover1 = Keypair.generate();
    const testApprover2 = Keypair.generate();

    // Add approvers
    await program.methods
      .addApprover(testApprover1.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addApprover(testApprover2.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Store original vault data
    const vaultBefore = await program.account.vault.fetch(freshVaultPda);
    const originalName = vaultBefore.name;
    const originalThreshold = vaultBefore.approvalThreshold;
    const originalDailyLimit = vaultBefore.dailyLimit.toString();

    // Remove one approver
    await program.methods
      .removeApprover(testApprover1.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify other vault data is unchanged
    const vaultAfter = await program.account.vault.fetch(freshVaultPda);
    expect(vaultAfter.name).to.equal(originalName);
    expect(vaultAfter.approvalThreshold).to.equal(originalThreshold);
    expect(vaultAfter.dailyLimit.toString()).to.equal(originalDailyLimit);
    expect(vaultAfter.owner.equals(provider.wallet.publicKey)).to.be.true;
    expect(vaultAfter.frozen).to.be.false;
  });
});
