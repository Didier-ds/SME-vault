import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { fundWallet } from "./utils/fund-wallet";
import { DEVNET_USDC_MINT, getTokenAccounts } from "./utils/token-setup";

describe("sme-vault", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SmeVault as Program<SmeVault>;
  const provider = anchor.AnchorProvider.env();

  describe("add_staff", () => {
    let vaultPda: PublicKey;
    let owner: PublicKey;
    let staffMember1: Keypair;
    let staffMember2: Keypair;
    let nonOwner: Keypair;
    const vaultName = "Test Vault for Staff";

    before(async () => {
      owner = provider.wallet.publicKey;
      staffMember1 = Keypair.generate();
      staffMember2 = Keypair.generate();
      nonOwner = Keypair.generate();

      // Fund test wallets from provider wallet (bypasses faucet rate limits)
      await fundWallet(provider, staffMember1.publicKey, 0.05);
      await fundWallet(provider, staffMember2.publicKey, 0.05);
      await fundWallet(provider, nonOwner.publicKey, 0.05);
    });

    // Helper function to create a vault with unique name
    const createTestVault = async (vaultName: string) => {
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          owner.toBuffer(),
          Buffer.from(vaultName),
        ],
        program.programId
      );

      const tokenAccounts = getTokenAccounts(vaultPda, DEVNET_USDC_MINT);

      try {
        await program.methods
          .createVault(
            vaultName,
            2,
            new anchor.BN(10000),
            new anchor.BN(5000),
            new anchor.BN(3000),
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
      } catch (error) {
        // Vault might already exist, that's okay
      }

      return vaultPda;
    };

    it("Owner can add a staff member", async () => {
      const vaultName = `Test Vault ${Date.now()}-1`; // Unique name
      const vaultPda = await createTestVault(vaultName);

      const tx = await program.methods
        .addStaff(staffMember1.publicKey)
        .accounts({
          vault: vaultPda,
          owner: owner,
        })
        .rpc();

      console.log("✅ Staff member added! Signature:", tx);

      // Fetch vault and verify staff member was added
      const vaultAccount = await program.account.vault.fetch(vaultPda);

      expect(vaultAccount.staff.length).to.equal(1);
      expect(vaultAccount.staff[0].toString()).to.equal(
        staffMember1.publicKey.toString()
      );
    });

    it("Owner can add multiple staff members", async () => {
      const vaultName = `Test Vault ${Date.now()}-2`; // Unique name
      const vaultPda = await createTestVault(vaultName);

      // Add first staff member
      await program.methods
        .addStaff(staffMember1.publicKey)
        .accounts({
          vault: vaultPda,
          owner: owner,
        })
        .rpc();

      // Add second staff member
      await program.methods
        .addStaff(staffMember2.publicKey)
        .accounts({
          vault: vaultPda,
          owner: owner,
        })
        .rpc();

      // Verify both are in the list
      const vaultAccount = await program.account.vault.fetch(vaultPda);

      expect(vaultAccount.staff.length).to.equal(2);
      expect(
        vaultAccount.staff.some(
          (s) => s.toString() === staffMember1.publicKey.toString()
        )
      ).to.be.true;
      expect(
        vaultAccount.staff.some(
          (s) => s.toString() === staffMember2.publicKey.toString()
        )
      ).to.be.true;
    });

    it("Fails when non-owner tries to add staff", async () => {
      const vaultName = `Test Vault ${Date.now()}-3`; // Unique name
      const vaultPda = await createTestVault(vaultName);

      try {
        await program.methods
          .addStaff(staffMember1.publicKey)
          .accounts({
            vault: vaultPda,
            owner: nonOwner.publicKey, // Wrong owner!
          })
          .signers([nonOwner]) // Sign with non-owner
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Should fail with unauthorized error
        expect(error.error.errorMessage).to.include("Unauthorized");
      }
    });

    it("Fails when trying to add duplicate staff", async () => {
      const vaultName = `Test Vault ${Date.now()}-4`; // Unique name
      const vaultPda = await createTestVault(vaultName);

      // Add staff member first time
      await program.methods
        .addStaff(staffMember1.publicKey)
        .accounts({
          vault: vaultPda,
          owner: owner,
        })
        .rpc();

      // Try to add same staff member again
      try {
        await program.methods
          .addStaff(staffMember1.publicKey) // Same staff!
          .accounts({
            vault: vaultPda,
            owner: owner,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorMessage).to.include("Duplicate staff");
      }
    });

    it("Fails when trying to exceed max staff (20)", async () => {
      const vaultName = `Test Vault ${Date.now()}-5`; // Unique name
      const vaultPda = await createTestVault(vaultName);

      // Add 20 staff members (the max)
      const staffMembers: Keypair[] = [];
      for (let i = 0; i < 20; i++) {
        const staff = Keypair.generate();
        staffMembers.push(staff);

        // Airdrop SOL
        await fundWallet(provider, 
          staff.publicKey,
          0.05
        );

        // Add staff
        await program.methods
          .addStaff(staff.publicKey)
          .accounts({
            vault: vaultPda,
            owner: owner,
          })
          .rpc();
      }

      // Verify we have 20 staff members
      let vaultAccount = await program.account.vault.fetch(vaultPda);
      expect(vaultAccount.staff.length).to.equal(20);

      // Try to add 21st staff member (should fail)
      const staff21 = Keypair.generate();
      await fundWallet(provider, 
        staff21.publicKey,
        0.05
      );

      try {
        await program.methods
          .addStaff(staff21.publicKey)
          .accounts({
            vault: vaultPda,
            owner: owner,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorMessage).to.include("Max staff");
      }
    });

    it("Staff list persists after adding", async () => {
      const vaultName = `Test Vault ${Date.now()}-6`; // Unique name
      const vaultPda = await createTestVault(vaultName);

      // Add staff member
      await program.methods
        .addStaff(staffMember1.publicKey)
        .accounts({
          vault: vaultPda,
          owner: owner,
        })
        .rpc();

      // Fetch vault multiple times to ensure persistence
      const vault1 = await program.account.vault.fetch(vaultPda);
      expect(vault1.staff.length).to.equal(1);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch again
      const vault2 = await program.account.vault.fetch(vaultPda);
      expect(vault2.staff.length).to.equal(1);
      expect(vault2.staff[0].toString()).to.equal(
        staffMember1.publicKey.toString()
      );
    });
  });
});
