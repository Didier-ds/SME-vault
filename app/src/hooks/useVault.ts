import { useEffect, useState, useCallback } from "react";
import { useProgram } from "./useProgram";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { VaultData } from "../types/vault";

// Re-export VaultData for backward compatibility
export type { VaultData } from "../types/vault";

export function useVault(vaultAddress?: string) {
  const { program } = useProgram();
  const { connection } = useConnection();
  const [vault, setVault] = useState<VaultData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tokenAccountAddress, setTokenAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVault = useCallback(async () => {
    if (!program || !vaultAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const vaultPubkey = new PublicKey(vaultAddress);
      
      // Fetch vault account data
      const vaultAccount = await program.account.vault.fetch(vaultPubkey);
      console.log("🔄 Vault refetched:", {
        staff: vaultAccount.staff?.length,
        approvers: vaultAccount.approvers?.length,
        timestamp: new Date().toISOString()
      });
      // Force new object reference to trigger React re-render
      setVault({ ...vaultAccount } as VaultData);

      // Calculate the vault's associated token account address using the vault's token mint
      const vaultTokenAccount = await getAssociatedTokenAddress(
        vaultAccount.tokenMint as PublicKey,
        vaultPubkey,
        true // allowOwnerOffCurve - required for PDAs
      );
      
      console.log("🔍 Debug Info:");
      console.log("Vault PDA:", vaultPubkey.toString());
      console.log("Token Mint:", vaultAccount.tokenMint.toString());
      console.log("Calculated Token Account:", vaultTokenAccount.toString());
      
      setTokenAccountAddress(vaultTokenAccount.toString());

      // Try to fetch the token account balance
      try {
        const tokenAccountInfo = await connection.getTokenAccountBalance(vaultTokenAccount);
        // Convert to decimal number using the token's decimals
        const tokenBalance = Number(tokenAccountInfo.value.amount) / Math.pow(10, tokenAccountInfo.value.decimals);
        console.log("✅ Token balance found:", tokenBalance);
        setBalance(tokenBalance);
      } catch (err) {
        // Token account might not exist yet (vault not funded)
        console.log("❌ Token account not found or not funded yet");
        console.log("Error:", err);
        setBalance(0);
      }
    } catch (err) {
      console.error("Error fetching vault:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vault");
    } finally {
      setLoading(false);
    }
  }, [program, vaultAddress, connection]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  return {
    vault,
    balance,
    tokenAccountAddress,
    loading,
    error,
    refetch: fetchVault,
  };
}
