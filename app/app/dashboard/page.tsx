"use client";

import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/dashboard/hero-card";
import { WithdrawalRequestsList } from "@/components/dashboard/WithdrawalRequestsList";
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

      {/* Withdrawal Requests */}
      <section className="space-y-4">
        <h3 className="text-xl font-light text-primary/80">Withdrawal Requests</h3>
        <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md">
          <WithdrawalRequestsList vaultAddress={selectedVault} />
        </div>
      </section>
    </>
  );
}
