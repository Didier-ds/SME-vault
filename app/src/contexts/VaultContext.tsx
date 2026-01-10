"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUserVaults } from "../hooks";

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
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const { vaults, loading } = useUserVaults();

  // Auto-select first vault when vaults load
  useEffect(() => {
    if (!loading && vaults.length > 0 && !selectedVault) {
      setSelectedVault(vaults[0].address);
    }
  }, [loading, vaults, selectedVault]);

  return (
    <VaultContext.Provider value={{ selectedVault, setSelectedVault, vaults, loading }}>
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
