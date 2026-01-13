import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

/**
 * Devnet USDC mint address
 * For testing purposes, we'll use a placeholder that can be replaced
 * or you can create a new mint in each test
 */
export const DEVNET_USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // Devnet USDC
);

/**
 * Get the vault's associated token account address
 */
export function getVaultTokenAccount(
  vaultPda: PublicKey,
  tokenMint: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(
    tokenMint,
    vaultPda,
    true // allowOwnerOffCurve - PDAs are not on the ed25519 curve
  );
}

/**
 * Get common token account info for tests
 */
export function getTokenAccounts(vaultPda: PublicKey, tokenMint: PublicKey) {
  return {
    tokenMint,
    vaultTokenAccount: getVaultTokenAccount(vaultPda, tokenMint),
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };
}
