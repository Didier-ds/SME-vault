import *  as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { SmeVault } from "../target/types/sme_vault";
import {expect} from "chai";
describe("sme-vault", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.smeVault as Program<SmeVault>
    const provider = anchor.AnchorProvider.env();

    describe("add_approver", () => {
        let vaultPda: PublicKey;
        let owner: PublicKey;
        let approver1: Keypair;
        let approver2: Keypair;
        let nonOwner: Keypair;
        const vaultName = "Test Vault for Approvers";

        const airdropAndConfirm = async (publicKey: PublicKey, amount: number) => {
            const signature = await provider.connection.requestAirdrop(
                publicKey,
                amount
            );

            const latestBlockhash = await provider.connection.getLatestBlockhash();
            await provider.connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });
        };

        beforeEach(async () => {
            owner = provider.wallet.publicKey;
            approver1 = Keypair.generate();
            approver2 = Keypair.generate();
            nonOwner = Keypair.generate();

            // Airdrop SOL to test keypairs (using modern approach)
            await airdropAndConfirm(
                approver1.publicKey,
                2 * anchor.web3.LAMPORTS_PER_SOL
            );
            await airdropAndConfirm(
                approver2.publicKey,
                2 * anchor.web3.LAMPORTS_PER_SOL
            );
            await airdropAndConfirm(
                nonOwner.publicKey,
                2 * anchor.web3.LAMPORTS_PER_SOL
            );
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
                        owner: owner,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    })
                    .rpc();
            } catch (error) {
                // Vault might already exist, that's okay
            }

            return vaultPda;
        };

        it('Owner can add an approver', async () => {
            const vaultName = `Test Vault ${Date.now()}-1`; // Unique name
            const vaultPda = await createTestVault(vaultName);

            const tx = await program.methods.addApprover(approver1.publicKey)
                .accounts({
                    vault: vaultPda,
                    owner: owner
                }).rpc()

            console.log("✅ Approver added! Signature:", tx);

            // Fetch vault and verify approver was added
            const vaultAccount = await program.account.vault.fetch(vaultPda);

            expect(vaultAccount.approvers.length).to.equal(1);
            expect(vaultAccount.approvers[0].toString()).to.equal(
                approver1.publicKey.toString()
            );
        });

        it("Owner can add multiple approvers", async () => {
            const vaultName = `Test Vault ${Date.now()}-2`; // Unique name
            const vaultPda = await createTestVault(vaultName);

            // Add first approver
            await program.methods
                .addApprover(approver1.publicKey)
                .accounts({
                    vault: vaultPda,
                    owner: owner,
                })
                .rpc();

            // Add second approver
            await program.methods
                .addApprover(approver2.publicKey)
                .accounts({
                    vault: vaultPda,
                    owner: owner,
                })
                .rpc();

            // Verify both are in the list
            const vaultAccount = await program.account.vault.fetch(vaultPda);

            expect(vaultAccount.approvers.length).to.equal(2);
            expect(
                vaultAccount.approvers.some(
                    (a) => a.toString() === approver1.publicKey.toString()
                )
            ).to.be.true;
            expect(
                vaultAccount.approvers.some(
                    (a) => a.toString() === approver2.publicKey.toString()
                )
            ).to.be.true;
        });

        it("Fails when non-owner tries to add approver", async () => {
            const vaultName = `Test Vault ${Date.now()}-3`; // Unique name
            const vaultPda = await createTestVault(vaultName);

            try {
                await program.methods
                    .addApprover(approver1.publicKey)
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

        it("Fails when trying to add duplicate approver", async () => {
            const vaultName = `Test Vault ${Date.now()}-4`; // Unique name
            const vaultPda = await createTestVault(vaultName);

            // Add approver first time
            await program.methods
                .addApprover(approver1.publicKey)
                .accounts({
                    vault: vaultPda,
                    owner: owner,
                })
                .rpc();

            // Try to add same approver again
            try {
                await program.methods
                    .addApprover(approver1.publicKey) // Same approver!
                    .accounts({
                        vault: vaultPda,
                        owner: owner,
                    })
                    .rpc();

                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.error.errorMessage).to.include("Duplicate approver");
            }
        });

        it("Fails when trying to exceed max approvers (10)", async () => {
            const vaultName = `Test Vault ${Date.now()}-5`; // Unique name
            const vaultPda = await createTestVault(vaultName);

            // Add 10 approvers (the max)
            const approvers: Keypair[] = [];
            for (let i = 0; i < 10; i++) {
                const approver = Keypair.generate();
                approvers.push(approver);

                // Airdrop SOL
                await airdropAndConfirm(
                    approver.publicKey,
                    2 * anchor.web3.LAMPORTS_PER_SOL
                );

                // Add approver
                await program.methods
                    .addApprover(approver.publicKey)
                    .accounts({
                        vault: vaultPda,
                        owner: owner,
                    })
                    .rpc();
            }

            // Verify we have 10 approvers
            let vaultAccount = await program.account.vault.fetch(vaultPda);
            expect(vaultAccount.approvers.length).to.equal(10);

            // Try to add 11th approver (should fail)
            const approver11 = Keypair.generate();
            await airdropAndConfirm(
                approver11.publicKey,
                2 * anchor.web3.LAMPORTS_PER_SOL
            );

            try {
                await program.methods
                    .addApprover(approver11.publicKey)
                    .accounts({
                        vault: vaultPda,
                        owner: owner,
                    })
                    .rpc();

                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.error.errorMessage).to.include("Max approvers");
            }
        });

        it("Approver list persists after adding", async () => {
            const vaultName = `Test Vault ${Date.now()}-6`; // Unique name
            const vaultPda = await createTestVault(vaultName);

            // Add approver
            await program.methods
                .addApprover(approver1.publicKey)
                .accounts({
                    vault: vaultPda,
                    owner: owner,
                })
                .rpc();

            // Fetch vault multiple times to ensure persistence
            const vault1 = await program.account.vault.fetch(vaultPda);
            expect(vault1.approvers.length).to.equal(1);

            // Wait a bit
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Fetch again
            const vault2 = await program.account.vault.fetch(vaultPda);
            expect(vault2.approvers.length).to.equal(1);
            expect(vault2.approvers[0].toString()).to.equal(
                approver1.publicKey.toString()
            );
        });
    })
})