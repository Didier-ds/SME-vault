import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NexusTreasury } from "../target/types/nexus_treasury";
import { expect } from "chai";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("remove_staff", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NexusTreasury as Program<NexusTreasury>;

  // 🔍 HELPER FUNCTION: Show msg!() logs from Rust
  async function showLogs(signature: string, label: string = "Transaction") {
    // Wait a bit for transaction to be confirmed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const tx = await provider.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed", // Use confirmed commitment level
    });

    console.log(`\n📋 ${label} Logs:`);
    console.log("================================");
    if (tx?.meta?.logMessages) {
      tx.meta.logMessages.forEach((log) => {
        if (log.includes("Program log:")) {
          // Remove "Program log: " prefix for cleaner output
          console.log("  " + log.replace("Program log: ", ""));
        }
      });
    }
    console.log("================================\n");
  }

  let vaultPda: PublicKey;
  let staffMember1: Keypair;
  let staffMember2: Keypair;
  let staffMember3: Keypair;
  const vaultName = `Test Vault ${Date.now()}`;

  before(async () => {
    // Create test staff members
    staffMember1 = Keypair.generate();
    staffMember2 = Keypair.generate();
    staffMember3 = Keypair.generate();

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
        new anchor.BN(5000_000000), // tx limit
        new anchor.BN(3000_000000), // large withdrawal threshold
        new anchor.BN(24) // delay hours
      )
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add 3 staff members to start
    await program.methods
      .addStaff(staffMember1.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addStaff(staffMember2.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addStaff(staffMember3.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Successfully removes a staff member", async () => {
    // Verify staffMember3 exists before removal
    let vault = await program.account.vault.fetch(vaultPda);
    expect(vault.staff.length).to.equal(3);
    expect(vault.staff.some((s) => s.equals(staffMember3.publicKey))).to.be
      .true;

    // Remove staffMember3
    const tx = await program.methods
      .removeStaff(staffMember3.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // 🔍 Show the msg!() logs from your Rust code
    await showLogs(tx, "REMOVE_STAFF");

    // Verify staffMember3 was removed
    vault = await program.account.vault.fetch(vaultPda);
    expect(vault.staff.length).to.equal(2);
    expect(vault.staff.some((s) => s.equals(staffMember3.publicKey))).to.be
      .false;

    // Verify staffMember1 and staffMember2 still exist
    expect(vault.staff.some((s) => s.equals(staffMember1.publicKey))).to.be
      .true;
    expect(vault.staff.some((s) => s.equals(staffMember2.publicKey))).to.be
      .true;
  });

  it("Fails when non-owner tries to remove staff", async () => {
    const nonOwner = Keypair.generate();

    // Airdrop SOL to non-owner for transaction fees
    const signature = await provider.connection.requestAirdrop(
      nonOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    try {
      await program.methods
        .removeStaff(staffMember1.publicKey)
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

  it("Fails when trying to remove non-existent staff member", async () => {
    const nonExistentStaff = Keypair.generate();

    try {
      await program.methods
        .removeStaff(nonExistentStaff.publicKey)
        .accounts({
          vault: vaultPda,
          owner: provider.wallet.publicKey,
        })
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error: any) {
      // Should fail with StaffNotFound or similar error
      expect(error).to.exist;
      // You can add more specific error checking here once you define the error
      // expect(error.error.errorCode.code).to.equal("StaffNotFound");
    }
  });

  it("Can remove all staff members (no threshold restriction)", async () => {
    // Unlike approvers, staff don't have a threshold requirement
    // So we should be able to remove all of them

    // Current state: 2 staff members (staffMember1, staffMember2)
    let vault = await program.account.vault.fetch(vaultPda);
    expect(vault.staff.length).to.equal(2);

    // Remove first staff member
    await program.methods
      .removeStaff(staffMember1.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    vault = await program.account.vault.fetch(vaultPda);
    expect(vault.staff.length).to.equal(1);

    // Remove second staff member (should succeed - no threshold)
    await program.methods
      .removeStaff(staffMember2.publicKey)
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify all staff removed
    vault = await program.account.vault.fetch(vaultPda);
    expect(vault.staff.length).to.equal(0);
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

    const testStaff1 = Keypair.generate();
    const testStaff2 = Keypair.generate();

    // Add staff members
    await program.methods
      .addStaff(testStaff1.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .addStaff(testStaff2.publicKey)
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

    // Remove one staff member
    await program.methods
      .removeStaff(testStaff1.publicKey)
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

  it("Can add staff back after removal", async () => {
    // Create a fresh vault
    const freshVaultName = `Test Vault ${Date.now()}-2`;
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

    const testStaff = Keypair.generate();

    // Add staff member
    await program.methods
      .addStaff(testStaff.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    let vault = await program.account.vault.fetch(freshVaultPda);
    expect(vault.staff.length).to.equal(1);

    // Remove staff member
    await program.methods
      .removeStaff(testStaff.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    vault = await program.account.vault.fetch(freshVaultPda);
    expect(vault.staff.length).to.equal(0);

    // Add the same staff member back (should succeed)
    await program.methods
      .addStaff(testStaff.publicKey)
      .accounts({
        vault: freshVaultPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    vault = await program.account.vault.fetch(freshVaultPda);
    expect(vault.staff.length).to.equal(1);
    expect(vault.staff[0].equals(testStaff.publicKey)).to.be.true;
  });
});
