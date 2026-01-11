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

    // Prevent duplicate fetches in React Strict Mode
    if (fetchingRef.current) {
      return;
    }

    const fetchUserVaults = async () => {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // Fetch ALL vault accounts (we'll filter client-side)
        // This is acceptable for development/small scale (<100 vaults)
        // For production, consider using an indexer service
        const allVaultAccounts = await program.account.vault.all();

        // Filter vaults where user has ANY role (owner, staff, or approver)
        const userVaults = allVaultAccounts.filter((account) => {
          const vault = account.account;
          
          // Check if user is owner
          if (vault.owner.equals(publicKey)) {
            return true;
          }

          // Check if user is in staff array
          if (vault.staff.some((staffKey: PublicKey) => staffKey.equals(publicKey))) {
            return true;
          }

          // Check if user is in approvers array
          if (vault.approvers.some((approverKey: PublicKey) => approverKey.equals(publicKey))) {
            return true;
          }

          return false;
        });

        // Map to VaultInfo objects
        const vaultInfos: VaultInfo[] = userVaults.map((account) => ({
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

