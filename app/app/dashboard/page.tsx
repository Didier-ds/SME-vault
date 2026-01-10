"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/dashboard/hero-card";
import { useUserVaults } from "../../src/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const { vaults, loading } = useUserVaults();

  // Auto-select first vault when vaults load
  useEffect(() => {
    if (!loading && vaults.length > 0 && !selectedVault) {
      setSelectedVault(vaults[0].address);
    }
  }, [loading, vaults.length, selectedVault]); // Fixed: use vaults.length instead of vaults

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
