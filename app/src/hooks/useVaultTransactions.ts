"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export interface VaultTransaction {
  signature: string;
  timestamp: number;
  type: "deposit" | "withdrawal" | "program_instruction" | "unknown";
  amount?: number;
  from?: string;
  to?: string;
  description: string;
}

export function useVaultTransactions(
  vaultAddress?: string,
  tokenMint?: PublicKey | null
) {
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultAddress || !tokenMint) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const vaultPubkey = new PublicKey(vaultAddress);
        
        // Get vault token account address
        const vaultTokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          vaultPubkey,
          true // allowOwnerOffCurve for PDA
        );

        console.log("🔍 Fetching transactions for vault token account:", vaultTokenAccount.toString());

        // Fetch transaction signatures for the token account (deposits/withdrawals)
        const tokenAccountSignatures = await connection.getSignaturesForAddress(
          vaultTokenAccount,
          { limit: 50 }
        );

        console.log(`📊 Found ${tokenAccountSignatures.length} transactions for token account`);

        // Fetch transaction signatures for the vault PDA (program instructions)
        const vaultSignatures = await connection.getSignaturesForAddress(
          vaultPubkey,
          { limit: 50 }
        );

        // Combine and deduplicate signatures
        const allSignatures = new Map<string, { signature: string; timestamp: number }>();
        
        tokenAccountSignatures.forEach((sig) => {
          allSignatures.set(sig.signature, {
            signature: sig.signature,
            timestamp: sig.blockTime || 0,
          });
        });

        vaultSignatures.forEach((sig) => {
          if (!allSignatures.has(sig.signature)) {
            allSignatures.set(sig.signature, {
              signature: sig.signature,
              timestamp: sig.blockTime || 0,
            });
          }
        });

        // Fetch transaction details for a subset (to avoid rate limits)
        const signatureArray = Array.from(allSignatures.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 30); // Limit to most recent 30

        const transactionDetails: VaultTransaction[] = [];

        for (const { signature, timestamp } of signatureArray) {
          try {
            const tx = await connection.getTransaction(signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (!tx) continue;

            // Check if this is a token transfer
            const isTokenTransfer = tx.meta?.postTokenBalances?.some(
              (balance) => balance.accountIndex !== undefined
            ) || tx.meta?.preTokenBalances?.some(
              (balance) => balance.accountIndex !== undefined
            );

            // Check if this involves the vault token account
            // Handle both legacy and versioned transactions
            let accountKeysStr: string[] = [];
            if ('accountKeys' in tx.transaction.message) {
              // Legacy transaction - accountKeys is PublicKey[]
              const accountKeys = (tx.transaction.message as { accountKeys: PublicKey[] }).accountKeys;
              accountKeysStr = accountKeys.map(key => key.toString());
            } else {
              // Versioned transaction - use getAccountKeys()
              const accountKeys = tx.transaction.message.getAccountKeys();
              accountKeysStr = accountKeys.staticAccountKeys.map(key => key.toString());
              accountKeysStr.push(...accountKeys.keySegments().flat().map(key => key.toString()));
            }
            
            const vaultTokenAccountStr = vaultTokenAccount.toString();
            const involvesVault = accountKeysStr.includes(vaultTokenAccountStr);

            if (isTokenTransfer && involvesVault) {
              // Try to parse token transfer
              const postBalances = tx.meta?.postTokenBalances || [];
              const preBalances = tx.meta?.preTokenBalances || [];

              // Find the account index of the vault token account
              const vaultTokenAccountIndex = accountKeysStr.indexOf(vaultTokenAccountStr);

              if (vaultTokenAccountIndex !== -1) {
                // Find balance changes for the vault token account by account index
                const vaultTokenBalance = postBalances.find(
                  (b) => b.accountIndex === vaultTokenAccountIndex
                );
                const vaultTokenBalanceBefore = preBalances.find(
                  (b) => b.accountIndex === vaultTokenAccountIndex
                );

                // Also try to find by mint address as fallback
                const vaultTokenBalanceByMint = postBalances.find(
                  (b) => b.mint === tokenMint.toString()
                );
                const vaultTokenBalanceBeforeByMint = preBalances.find(
                  (b) => b.mint === tokenMint.toString()
                );

                const finalPostBalance = vaultTokenBalance || vaultTokenBalanceByMint;
                const finalPreBalance = vaultTokenBalanceBefore || vaultTokenBalanceBeforeByMint;

                if (finalPostBalance || finalPreBalance) {
                  const amountAfter = finalPostBalance 
                    ? parseFloat(finalPostBalance.uiTokenAmount.uiAmountString || "0")
                    : 0;
                  const amountBefore = finalPreBalance
                    ? parseFloat(finalPreBalance.uiTokenAmount.uiAmountString || "0")
                    : 0;
                  const amount = amountAfter - amountBefore;

                  if (Math.abs(amount) > 0.000001) { // Ignore tiny amounts (dust)
                    if (amount > 0) {
                      // Deposit
                      transactionDetails.push({
                        signature,
                        timestamp,
                        type: "deposit",
                        amount: Math.abs(amount),
                        description: `Deposited ${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
                      });
                    } else if (amount < 0) {
                      // Withdrawal
                      transactionDetails.push({
                        signature,
                        timestamp,
                        type: "withdrawal",
                        amount: Math.abs(amount),
                        description: `Withdrew ${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
                      });
                    }
                  }
                } else {
                  // Fallback: Check all token balances for our mint and see if any account matches
                  const tokenMintStr = tokenMint.toString();
                  const relevantPostBalance = postBalances.find(
                    (b) => b.mint === tokenMintStr && 
                    accountKeysStr[b.accountIndex] === vaultTokenAccountStr
                  );
                  const relevantPreBalance = preBalances.find(
                    (b) => b.mint === tokenMintStr && 
                    accountKeysStr[b.accountIndex] === vaultTokenAccountStr
                  );

                  if (relevantPostBalance || relevantPreBalance) {
                    const amountAfter = relevantPostBalance 
                      ? parseFloat(relevantPostBalance.uiTokenAmount.uiAmountString || "0")
                      : 0;
                    const amountBefore = relevantPreBalance
                      ? parseFloat(relevantPreBalance.uiTokenAmount.uiAmountString || "0")
                      : 0;
                    const amount = amountAfter - amountBefore;

                    if (Math.abs(amount) > 0.000001) {
                      if (amount > 0) {
                        transactionDetails.push({
                          signature,
                          timestamp,
                          type: "deposit",
                          amount: Math.abs(amount),
                          description: `Deposited ${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
                        });
                      } else if (amount < 0) {
                        transactionDetails.push({
                          signature,
                          timestamp,
                          type: "withdrawal",
                          amount: Math.abs(amount),
                          description: `Withdrew ${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
                        });
                      }
                    }
                  } else {
                    // If we can't find balance info but transaction involves the account, still add it
                    console.log(`⚠️ Could not parse balance for transaction ${signature}, but it involves vault token account`);
                    transactionDetails.push({
                      signature,
                      timestamp,
                      type: "deposit", // Assume deposit if we can't determine
                      description: "Token transfer to vault",
                    });
                  }
                }
              }
            } else if (involvesVault) {
              // Other transaction involving vault
              transactionDetails.push({
                signature,
                timestamp,
                type: "program_instruction",
                description: "Vault transaction",
              });
            }
          } catch (err) {
            console.error(`Error fetching transaction ${signature}:`, err);
            // Continue with other transactions
          }
        }

        setTransactions(transactionDetails);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [connection, vaultAddress, tokenMint]);

  return {
    transactions,
    loading,
    error,
  };
}

