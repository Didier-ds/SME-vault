import * as anchor from "@coral-xyz/anchor"
import {Program} from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { SmeVault } from "../target/types/sme_vault";
import {expect} from "chai";

describe("sme-vault", () => {
    anchor.setProvider(anchor.AnchorProvider.env())

    const program = anchor.workspace.smeVault as Program<SmeVault>;
    const provider = anchor.AnchorProvider.env()

    describe("create-vault", () => {
        it("Creates a vault with valid parameters", async () => {
            const vaultName = "Test vault";
            const owner = provider.wallet.publicKey;

            const [vaultPda] = PublicKey.findProgramAddressSync([
                Buffer.from("vault"),
                owner.toBuffer(),
                Buffer.from(vaultName)
            ],
                program.programId)

            const tx = await program.methods
                .createVault(
                    vaultName,
                    2,
                    new anchor.BN(10000),
                    new anchor.BN(5000),
                    new anchor.BN(3000),
                    new anchor.BN(24)
                ).accounts({
                    vault:vaultPda,
                    owner,
                    systemProgram: anchor.web3.SystemProgram.programId
                }).rpc()

            console.log("✅ Vault created! Signature:", tx);

            // Fetch and verify the vault
            const vaultAccount = await program.account.vault.fetch(vaultPda);

            expect(vaultAccount.name).to.equal(vaultName);
            expect(vaultAccount.owner.toString()).to.equal(owner.toString());
            expect(vaultAccount.approvalThreshold).to.equal(2);
            expect(vaultAccount.dailyLimit.toNumber()).to.equal(10000);
            expect(vaultAccount.txLimit.toNumber()).to.equal(5000);
            expect(vaultAccount.largeWithdrawalThreshold.toNumber()).to.equal(3000);
            expect(vaultAccount.delayHours.toNumber()).to.equal(24);
            expect(vaultAccount.frozen).to.equal(false);
            expect(vaultAccount.approvers.length).to.equal(0);
            expect(vaultAccount.staff.length).to.equal(0);
        });

        it("Fails with empty vault name", async () => {
            const vaultName = "";
            const owner = provider.wallet.publicKey

            const [vaultPda] = PublicKey.findProgramAddressSync([
                    Buffer.from("vault"),
                    owner.toBuffer(),
                    Buffer.from(vaultName)
                ],
                program.programId)

            try {
                await program.methods.createVault(
                    vaultName,
                    2,
                    new anchor.BN(10000),
                    new anchor.BN(5000),
                    new anchor.BN(3000),
                    new anchor.BN(24)
                ).accounts({
                    vault: vaultPda,
                    owner: owner,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                    .rpc();

                expect.fail("Should have thrown an error");
            } catch (response: any) {
                expect(response.error.errorMessage).to.include("Invalid name");
            }
        });

        it("Fails with zero approval threshold", async () => {
            const owner = provider.wallet.publicKey;
            const vaultName = "Test Vault";

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
                        0,  // Zero threshold!
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

                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.error.errorMessage).to.include("Invalid threshold");
            }
        });

        it("Fails with zero daily limit", async () => {
            const owner = provider.wallet.publicKey;
            const vaultName = "Test Vault";

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
                        new anchor.BN(0),  // Zero limit!
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

                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.error.errorMessage).to.include("Invalid limit");
            }
        });
    })
})