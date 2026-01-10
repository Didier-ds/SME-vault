"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VaultSwitcher } from "@/components/dashboard/vault-switcher";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useUserVaults } from "../../src/hooks";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const { vaults } = useUserVaults();

  const handleCreateVault = () => {
    router.push("/dashboard/create-vault");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar/50 backdrop-blur-md hidden md:flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-light tracking-wide font-display text-primary mb-8">
            SME Vault
          </h1>
          
          {/* Vault Switcher - only shows if user has vaults */}
          <VaultSwitcher 
            selectedVault={selectedVault}
            onVaultChange={setSelectedVault}
            onCreateVault={handleCreateVault}
          />
          
          <nav className="space-y-6">
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              Overview
            </div>
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              Withdrawals
            </div>
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              Team
            </div>
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              Settings
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 space-y-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-thin font-display text-primary">
            {/* Page title will be passed by children */}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-xs">
              Admin
            </div>
            <ConnectWalletButton />
          </div>
        </header>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
