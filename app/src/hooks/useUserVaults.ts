"use client";

import { useEffect, useState, useRef } from "react";
import { useProgram } from "./useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

interface VaultInfo {
  address: string;
  name: string;
  owner: PublicKey;
  approvalThreshold: number;
  staffCount: number;
  approverCount: number;
}

export function useUserVaults() {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!program || !publicKey) {
      setVaults([]);
      return;
    }

    // Don't re-fetch if we already have vaults
    if (vaults.length > 0) {
      return;
    }

    // Prevent duplicate fetches in React Strict Mode
    if (fetchingRef.current) {
      return;
    }

    const fetchUserVaults = async () => {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // Fetch all vault accounts where the owner matches the connected wallet
        const vaultAccounts = await program.account.vault.all([
          {
            memcmp: {
              offset: 8, // Skip 8-byte discriminator
              bytes: publicKey.toBase58(), // Filter by owner
            },
          },
        ]);

        // Map to VaultInfo objects
        const vaultInfos: VaultInfo[] = vaultAccounts.map((account) => ({
          address: account.publicKey.toString(),
          name: account.account.name,
          owner: account.account.owner,
          approvalThreshold: account.account.approvalThreshold,
          staffCount: account.account.staff.length,
          approverCount: account.account.approvers.length,
        }));

        setVaults(vaultInfos);
      } catch (err) {
        console.error("Error fetching user vaults:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch vaults");
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchUserVaults();
  }, [program, publicKey]);

  return {
    vaults,
    loading,
    error,
    hasVaults: vaults.length > 0,
  };
}
