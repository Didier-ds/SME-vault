"use client";

import { useEffect, useState } from "react";
import { useProgram } from "./useProgram";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

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

export function useVault(vaultAddress?: string) {
  const { program } = useProgram();
  const { connection } = useConnection();
  const [vault, setVault] = useState<VaultData | null>(null);
  const [balance, setBalance] = useState<number>(0);
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

        // Fetch vault SOL balance
        const vaultBalance = await connection.getBalance(vaultPubkey);
        setBalance(vaultBalance / 1e9); // Convert lamports to SOL
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
    loading,
    error,
  };
}
