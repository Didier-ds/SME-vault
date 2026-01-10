"use client";

import { useState } from "react";
import { useUserVaults } from "../../src/hooks";
import { ChevronDown, Plus } from "lucide-react";

interface VaultSwitcherProps {
  selectedVault: string | null;
  onVaultChange: (vaultAddress: string) => void;
  onCreateVault: () => void;
}

export function VaultSwitcher({ selectedVault, onVaultChange, onCreateVault }: VaultSwitcherProps) {
  const { vaults, loading } = useUserVaults();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if no vaults
  if (!loading && vaults.length === 0) {
    return null;
  }

  // Find selected vault name
  const selectedVaultData = vaults.find(v => v.address === selectedVault);
  const displayName = selectedVaultData?.name || "Select Vault";

  if (loading) {
    return (
      <div className="px-4 py-3 mb-6">
        <div className="animate-pulse bg-primary/10 h-10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6 relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-sidebar-border/30 hover:bg-sidebar-border/50 rounded-lg flex items-center justify-between transition-colors group"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Vault</span>
          <span className="text-sm font-medium text-primary mt-0.5 truncate max-w-[160px]">
            {displayName}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-4 right-4 mt-2 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden">
            {/* Vault List */}
            <div className="max-h-64 overflow-y-auto">
              {vaults.map((vault) => (
                <button
                  key={vault.address}
                  onClick={() => {
                    onVaultChange(vault.address);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-b-0 ${
                    vault.address === selectedVault ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-primary">
                        {vault.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {vault.approverCount} approvers · {vault.staffCount} staff
                      </div>
                    </div>
                    {vault.address === selectedVault && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Create New Vault Button */}
            <button
              onClick={() => {
                onCreateVault();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-t border-border flex items-center gap-2 text-primary"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create New Vault</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
