import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

/**
 * Fund a wallet by transferring SOL from the provider's wallet
 * This bypasses devnet faucet rate limits
 */
export async function fundWallet(
  provider: anchor.AnchorProvider,
  destination: PublicKey,
  amountInSol: number
): Promise<void> {
  const lamports = amountInSol * anchor.web3.LAMPORTS_PER_SOL;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: destination,
      lamports,
    })
  );

  await provider.sendAndConfirm(transaction);
}
