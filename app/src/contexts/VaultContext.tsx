"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUserVaults } from "../hooks";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

interface VaultContextType {
  selectedVault: string | null;
  setSelectedVault: (address: string | null) => void;
  vaults: Array<{
    address: string;
    name: string;
    approverCount: number;
    staffCount: number;
  }>;
  loading: boolean;
  // Token mint details
  tokenMint: PublicKey | null;
  tokenDecimals: number;
  decimalMultiplier: number;
  decimalDivisor: number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

// USDC Devnet mint constant
const USDC_MINT = new PublicKey("Cs9XJ317LyuWhxe3DEsA4RCZuHtj8DjNgFJ29VqrKYX9");

export function VaultProvider({ children }: { children: ReactNode }) {
  const { vaults, loading } = useUserVaults();
  const { connection } = useConnection();
  
  // Load from localStorage on mount
  const [selectedVault, setSelectedVault] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedVault');
    }
    return null;
  });
  
  // Token mint state
  const [tokenMint, setTokenMint] = useState<PublicKey | null>(USDC_MINT);
  const [tokenDecimals, setTokenDecimals] = useState(6);
  const [decimalMultiplier, setDecimalMultiplier] = useState(1_000_000);
  const [decimalDivisor, setDecimalDivisor] = useState(1_000_000);

  // Auto-select vault: prioritize localStorage, then first vault
  useEffect(() => {
    if (loading || vaults.length === 0) return;

    // If we have a selected vault from localStorage, verify it exists
    if (selectedVault) {
      const vaultExists = vaults.some(v => v.address === selectedVault);
      if (vaultExists) return; // Keep it
      // Otherwise fall through to select first vault
    }

    // Select first vault if no valid selection
    setSelectedVault(vaults[0].address);
  }, [loading, vaults, selectedVault]);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (selectedVault && typeof window !== 'undefined') {
      localStorage.setItem('selectedVault', selectedVault);
    }
  }, [selectedVault]);

  // Fetch token mint decimals when vault is selected
  useEffect(() => {
    const fetchTokenDecimals = async () => {
      if (!selectedVault || !connection) return;

      try {
        const mintInfo = await connection.getParsedAccountInfo(USDC_MINT);
        const mintData = mintInfo.value?.data;
        const decimals = (mintData && 'parsed' in mintData) ? mintData.parsed.info.decimals : 6;
        
        setTokenMint(USDC_MINT);
        setTokenDecimals(decimals);
        setDecimalMultiplier(Math.pow(10, decimals));
        setDecimalDivisor(Math.pow(10, decimals));
        
        console.log(`VaultContext: Loaded token decimals: ${decimals}`);
      } catch (err) {
        console.error("Error fetching token decimals:", err);
      }
    };

    fetchTokenDecimals();
  }, [selectedVault, connection]);

  return (
    <VaultContext.Provider 
      value={{ 
        selectedVault, 
        setSelectedVault, 
        vaults, 
        loading,
        tokenMint,
        tokenDecimals,
        decimalMultiplier,
        decimalDivisor,
      }}
    >
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
