"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useProgram } from "./useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import type { VaultInfo } from "../types/vault";

export function useUserVaults() {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchUserVaults = useCallback(async () => {
    if (!program || !publicKey) {
      setVaults([]);
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches in React Strict Mode
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch vaults where the user is the owner
      // Filter by account size to only get vaults with the new structure (includes token_mint)
      const ownedVaultAccounts = await program.account.vault.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: publicKey.toBase58(),
          }
        },
        {
          dataSize: 1145, // New vault size with token_mint field (32 bytes larger than old 1113)
        }
      ]);

      console.log(`Found ${ownedVaultAccounts.length} vaults owned by user`);

      // Filter vaults where user has ANY role (owner, staff, or approver)
      // Since we're already filtering by owner above, we also need to fetch
      // vaults where user is staff or approver separately
      // For now, just show owned vaults
      const userVaults = ownedVaultAccounts;

      // Map to VaultInfo objects
      const vaultInfos: VaultInfo[] = userVaults.map((account) => ({
        address: account.publicKey.toString(),
        name: account.account.name,
        owner: account.account.owner,
        approvalThreshold: account.account.approvalThreshold,
        staffCount: account.account.staff.length,
        approverCount: account.account.approvers.length,
      }));
      
      // debugger

      setVaults(vaultInfos);
    } catch (err) {
      console.error("Error fetching user vaults:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vaults");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [program, publicKey]);

  useEffect(() => {
    fetchUserVaults();
  }, [fetchUserVaults]);

  return {
    vaults,
    loading,
    error,
    hasVaults: vaults.length > 0,
    refetch: fetchUserVaults,
  };
}

