"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserVaults } from "../../src/hooks";

interface VaultSelectorProps {
  onVaultSelected: (address: string) => void;
}

export function VaultSelector({ onVaultSelected }: VaultSelectorProps) {
  const { vaults, loading, error, hasVaults } = useUserVaults();
  const [selectedVault, setSelectedVault] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVault) {
      onVaultSelected(selectedVault);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-card border border-border rounded-2xl backdrop-blur-md">
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading your vaults...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-card border border-border rounded-2xl backdrop-blur-md">
        <div className="text-sm text-red-400">
          Error loading vaults: {error}
        </div>
      </div>
    );
  }

  if (!hasVaults) {
    return (
      <div className="p-6 bg-card border border-border rounded-2xl backdrop-blur-md">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            No vaults found for your wallet.
          </div>
          <div className="text-xs text-muted-foreground/70">
            Create a vault using the Anchor CLI or contact your administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-card border border-border rounded-2xl backdrop-blur-md">
      <div className="space-y-2">
        <Label htmlFor="vault-select" className="text-sm text-muted-foreground">
          Select Your Vault
        </Label>
        <select
          id="vault-select"
          value={selectedVault}
          onChange={(e) => setSelectedVault(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">-- Choose a vault --</option>
          {vaults.map((vault) => (
            <option key={vault.address} value={vault.address}>
              {vault.name} ({vault.approverCount} approvers, {vault.staffCount} staff)
            </option>
          ))}
        </select>
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={!selectedVault}
      >
        Load Vault
      </Button>
    </form>
  );
}
