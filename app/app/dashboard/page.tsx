"use client";

import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/dashboard/hero-card";
import { useVaultContext } from "../../src/contexts/VaultContext";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedVault, vaults } = useVaultContext();

  const handleCreateVault = () => {
    router.push("/dashboard/create-vault");
  };

  return (
    <>
      {/* Hero Card Component */}
      <HeroCard 
        vaultAddress={selectedVault}
        hasVaults={vaults.length > 0}
        onCreateVault={handleCreateVault}
      />

      {/* Recent Transactions Placeholder */}
      <section className="space-y-4">
        <h3 className="text-xl font-light text-primary/80">Recent Activity</h3>
        <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md">
          <div className="text-muted-foreground text-center py-10 font-mono text-sm">
            No transactions found
          </div>
        </div>
      </section>
    </>
  );
}
