"use client";

import type { VaultContextType } from "../types/vault";
import { useVaults } from "../hooks/useVaults";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMemo, useState, useEffect, createContext, useContext } from "react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();

  // Internal state for user-selected vault address (what user explicitly chose)
  const [userSelectedVaultAddress, setUserSelectedVaultAddress] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedVault');
    }
    return null;
  });

  // Compute effective selected vault address (auto-select first if none chosen)
  // This is computed BEFORE calling useVaults so we can pass it as parameter
  const selectedVaultAddress = useMemo(() => {
    // We'll compute this after we have vaults, so we need a stable value here
    return userSelectedVaultAddress;
  }, [userSelectedVaultAddress]);

  // Use combined hook - fetches all vaults + balance for selected
  const {
    vaults,
    vaultsLoading,
    vaultsError,
    refetchVaults,
    selectedVaultBalance,
    selectedVaultTokenAccount,
    balanceLoading,
    balanceError,
    refetchBalance,
  } = useVaults(selectedVaultAddress);

  // Compute effective selected vault address (auto-select first if none chosen)
  const effectiveSelectedVaultAddress = useMemo(() => {
    if (vaultsLoading || vaults.length === 0) return null;

    // If user has selected a vault, verify it still exists
    if (userSelectedVaultAddress) {
      const vaultExists = vaults.some(v => v.address === userSelectedVaultAddress);
      if (vaultExists) return userSelectedVaultAddress;
    }

    // Auto-select first vault (safe because we checked length above)
    return vaults[0]?.address ?? null;
  }, [vaultsLoading, vaults, userSelectedVaultAddress]);

  // Compute selectedVault by filtering from vaults array (no separate fetch!)
  const selectedVault = useMemo(() => {
    if (!effectiveSelectedVaultAddress || vaults.length === 0) return null;
    return vaults.find(v => v.address === effectiveSelectedVaultAddress) ?? null;
  }, [effectiveSelectedVaultAddress, vaults]);

  // Wrapper function to set vault and save to localStorage
  const setSelectedVault = (address: string | null) => {
    setUserSelectedVaultAddress(address);
    if (address && typeof window !== 'undefined') {
      localStorage.setItem('selectedVault', address);
    }
  };

  // Compute tokenMint from selectedVault (derived property)
  const tokenMint = useMemo(() => selectedVault?.tokenMint ?? null, [selectedVault]);

  // Token decimals state (needs to be fetched async)
  const [tokenDecimals, setTokenDecimals] = useState(6);
  const [tokenSymbol, setTokenSymbol] = useState<string>("Token");
  const [tokenName, setTokenName] = useState<string>("Token");

  // Fetch token decimals when tokenMint changes
  useEffect(() => {
    async function loadTokenDecimals() {
      if (!tokenMint || !connection) {
        setTokenDecimals(6); // Default to 6 decimals
        return;
      }

      try {
        // Get mint info to find decimals
        const mintInfo = await connection.getParsedAccountInfo(tokenMint);
        const decimals = (mintInfo.value?.data as { parsed?: { info?: { decimals?: number } } })?.parsed?.info?.decimals || 6;

        console.log(`VaultContext: Loaded token mint ${tokenMint.toString()} with ${decimals} decimals`);

        setTokenDecimals(decimals);
      } catch (err) {
        console.error("Error loading token decimals:", err);
        setTokenDecimals(6); // Fallback to 6 decimals
      }
    }

    loadTokenDecimals();
  }, [tokenMint, connection]);

  // Fetch token metadata (symbol, name) when tokenMint changes
  useEffect(() => {
    async function loadTokenMetadata() {
      if (!tokenMint) {
        setTokenSymbol("Token");
        setTokenName("Token");
        return;
      }

      try {
        const conn = connection as { _rpcEndpoint?: string; rpcEndpoint?: string };
        const endpoint =
          conn._rpcEndpoint ||
          conn.rpcEndpoint ||
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com";

        const umi = createUmi(endpoint).use(mplTokenMetadata());
        const asset = await fetchDigitalAsset(umi, umiPublicKey(tokenMint.toString()));

        const rawSymbol = asset.metadata.symbol ?? "";
        const rawName = asset.metadata.name ?? "";

        const symbol = rawSymbol.trim() || "Token";
        const name =
          rawName.trim() ||
          (symbol !== "Token" ? symbol : `${tokenMint.toString().slice(0, 4)}...${tokenMint
            .toString()
            .slice(-4)}`);

        setTokenSymbol(symbol);
        setTokenName(name);
      } catch (err) {
        console.error("Error loading token metadata:", err);
        const mintStr = tokenMint.toString();
        setTokenSymbol("Token");
        setTokenName(`${mintStr.slice(0, 4)}...${mintStr.slice(-4)}`);
      }
    }

    loadTokenMetadata();
  }, [tokenMint, connection]);

  // Compute multiplier and divisor from decimals (derived properties)
  const decimalMultiplier = useMemo(() => Math.pow(10, tokenDecimals), [tokenDecimals]);
  const decimalDivisor = useMemo(() => Math.pow(10, tokenDecimals), [tokenDecimals]);

  const value: VaultContextType = {
    // Vault selection
    selectedVaultAddress: effectiveSelectedVaultAddress,
    setSelectedVault,
    vaults,
    vaultsLoading,

    // Vault data (single source of truth)
    selectedVault,
    vaultBalance: selectedVaultBalance,
    vaultTokenAccount: selectedVaultTokenAccount,
    balanceLoading,
    vaultError: vaultsError || balanceError,
    refetchVaults,
    refetchBalance,

    // Computed token properties
    tokenMint,
    tokenDecimals,
    decimalMultiplier,
    decimalDivisor,
    tokenSymbol,
    tokenName,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVaultContext() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVaultContext must be used within VaultProvider");
  }
  return context;
}