"use client";

import { useEffect, useState } from "react";
import { useProgram } from "./useProgram";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import { BN } from "@coral-xyz/anchor";

interface VaultData {
  owner: PublicKey;
  name: string;
  approvers: PublicKey[];
  staff: PublicKey[];
  approvalThreshold: number;
  dailyLimit: BN;
  txLimit: BN;
  largeWithdrawalThreshold: BN;
  delayHours: BN;
  frozen: boolean;
  createdAt: BN;
  bump: number;
  withdrawalCount: BN;
}

// USDC Devnet Mint Address
const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export function useVault(vaultAddress?: string) {
  const { program } = useProgram();
  const { connection } = useConnection();
  const [vault, setVault] = useState<VaultData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tokenAccountAddress, setTokenAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!program || !vaultAddress) return;

    const fetchVault = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const vaultPubkey = new PublicKey(vaultAddress);
        
        // Fetch vault account data
        const vaultAccount = await program.account.vault.fetch(vaultPubkey);
        setVault(vaultAccount as VaultData);

        // Calculate the vault's associated token account address
        const vaultTokenAccount = await getAssociatedTokenAddress(
          USDC_MINT_DEVNET,
          vaultPubkey,
          true // allowOwnerOffCurve - required for PDAs
        );
        setTokenAccountAddress(vaultTokenAccount.toString());

        // Try to fetch the token account balance
        try {
          const tokenAccountInfo = await connection.getTokenAccountBalance(vaultTokenAccount);
          // Convert to decimal number (USDC has 6 decimals)
          const tokenBalance = Number(tokenAccountInfo.value.amount) / Math.pow(10, tokenAccountInfo.value.decimals);
          setBalance(tokenBalance);
        } catch {
          // Token account might not exist yet (vault not funded)
          console.log("Token account not found or not funded yet");
          setBalance(0);
        }
      } catch (err) {
        console.error("Error fetching vault:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch vault");
      } finally {
        setLoading(false);
      }
    };

    fetchVault();
  }, [program, vaultAddress, connection]);

  return {
    vault,
    balance,
    tokenAccountAddress,
    loading,
    error,
  };
}
