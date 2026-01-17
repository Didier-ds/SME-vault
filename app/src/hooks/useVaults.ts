"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useProgram } from "./useProgram";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { VaultData } from "../types/vault";

interface VaultWithMetadata extends VaultData {
  address: string;
}

/**
 * Hook that fetches all user's vaults with FULL data.
 * Selected vault is computed by filtering from this array (no separate fetch needed).
 * Only balance is fetched separately for the selected vault.
 */
export function useVaults(selectedVaultAddress?: string | null) {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  // All vaults with full data
  const [vaults, setVaults] = useState<VaultWithMetadata[]>([]);
  const [vaultsLoading, setVaultsLoading] = useState(false);
  const [vaultsError, setVaultsError] = useState<string | null>(null);
  const fetchingVaultsRef = useRef(false);

  // Balance for selected vault (only thing that needs separate fetch)
  const [selectedVaultBalance, setSelectedVaultBalance] = useState<number>(0);
  const [selectedVaultTokenAccount, setSelectedVaultTokenAccount] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Fetch all user's vaults with FULL data
  const fetchVaults = useCallback(async () => {
    if (!program || !publicKey) {
      setVaults([]);
      setVaultsLoading(false);
      return;
      
    }

    // Prevent duplicate fetches in React Strict Mode
    if (fetchingVaultsRef.current) {
      return;
    }

    fetchingVaultsRef.current = true;
    setVaultsLoading(true);
    setVaultsError(null);

    try {
      // Fetch ALL vaults (with new structure that includes token_mint)
      // Filter by account size to only get vaults with the new structure
      const allVaultAccounts = await program.account.vault.all([
        {
          dataSize: 1145, // New vault size with token_mint field (32 bytes larger than old 1113)
        }
      ]);

      console.log(`Found ${allVaultAccounts.length} total vaults`);

      // Filter vaults where user has ANY role (owner, staff, or approver)
      const userVaultAccounts = allVaultAccounts.filter((account) => {
        const vault = account.account;
        const isOwner = vault.owner.equals(publicKey);
        const isStaff = vault.staff.some((staffKey) => staffKey.equals(publicKey));
        const isApprover = vault.approvers.some((approverKey) => approverKey.equals(publicKey));
        
        return isOwner || isStaff || isApprover;
      });

      console.log(`Found ${userVaultAccounts.length} vaults where user has a role (owner, staff, or approver)`);

      // Map to VaultData with address
      const vaultsWithMetadata: VaultWithMetadata[] = userVaultAccounts.map((account) => ({
        ...account.account,
        address: account.publicKey.toString(),
      } as VaultWithMetadata));

      setVaults(vaultsWithMetadata);
    } catch (err) {
      console.error("Error fetching user vaults:", err);
      setVaultsError(err instanceof Error ? err.message : "Failed to fetch vaults");
    } finally {
      setVaultsLoading(false);
      fetchingVaultsRef.current = false;
    }
  }, [program, publicKey]);

  // Fetch balance for selected vault
  const fetchBalance = useCallback(async () => {
    if (!connection || !selectedVaultAddress || !vaults.length) {
      setSelectedVaultBalance(0);
      setSelectedVaultTokenAccount(null);
      setBalanceLoading(false);
      return;
    }

    // Find the selected vault from our already-fetched array
    const vault = vaults.find(v => v.address === selectedVaultAddress);
    if (!vault) {
      setSelectedVaultBalance(0);
      setSelectedVaultTokenAccount(null);
      setBalanceLoading(false);
      return;
    }

    setBalanceLoading(true);
    setBalanceError(null);

    try {
      const vaultPubkey = new PublicKey(selectedVaultAddress);

      // Calculate the vault's associated token account address
      const vaultTokenAccount = await getAssociatedTokenAddress(
        vault.tokenMint as PublicKey,
        vaultPubkey,
        true // allowOwnerOffCurve - required for PDAs
      );

      console.log("🔍 Fetching balance for:");
      console.log("Vault PDA:", vaultPubkey.toString());
      console.log("Token Mint:", vault.tokenMint.toString());
      console.log("Token Account:", vaultTokenAccount.toString());

      setSelectedVaultTokenAccount(vaultTokenAccount.toString());

      // Fetch the token account balance
      try {
        const tokenAccountInfo = await connection.getTokenAccountBalance(vaultTokenAccount);
        const tokenBalance = Number(tokenAccountInfo.value.amount) / Math.pow(10, tokenAccountInfo.value.decimals);
        console.log("✅ Token balance found:", tokenBalance);
        setSelectedVaultBalance(tokenBalance);
      } catch {
        // Token account might not exist yet (vault not funded)
        console.log("❌ Token account not found or not funded yet");
        setSelectedVaultBalance(0);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalanceError(err instanceof Error ? err.message : "Failed to fetch balance");
      setSelectedVaultBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, [connection, selectedVaultAddress, vaults]);

  // Fetch vaults on mount
  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  // Fetch balance when selected vault changes or vaults are loaded
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    // All vaults with full data
    vaults,
    vaultsLoading,
    vaultsError,
    hasVaults: vaults.length > 0,
    refetchVaults: fetchVaults,

    // Balance for selected vault
    selectedVaultBalance,
    selectedVaultTokenAccount,
    balanceLoading,
    balanceError,
    refetchBalance: fetchBalance,
  };
}
