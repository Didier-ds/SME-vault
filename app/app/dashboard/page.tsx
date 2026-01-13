"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/dashboard/hero-card";
import { WithdrawalRequestsList } from "@/components/dashboard/WithdrawalRequestsList";
import { TeamManagementModal } from "@/components/dashboard/TeamManagementModal";
import { WithdrawalRequestModal } from "@/components/dashboard/WithdrawalRequestModal";
import { useVaultContext } from "../../src/contexts/VaultContext";
import { useUserRole, useVault } from "../../src/hooks";
import { Button } from "@/components/ui/button";
import { Users, Send } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedVault, vaults } = useVaultContext();
  const { vault } = useVault(selectedVault || undefined);
  const { isOwner, isStaff } = useUserRole(selectedVault || undefined);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  const handleCreateVault = () => {
    router.push("/dashboard/create-vault");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Hero Card Component */}
      <HeroCard 
        vaultAddress={selectedVault}
        hasVaults={vaults.length > 0}
        onCreateVault={handleCreateVault}
      />

      {/* Action Buttons */}
      {selectedVault && (
        <div className="flex gap-3 justify-end">
          {isStaff && vault && (
            <Button 
              onClick={() => setWithdrawalModalOpen(true)} 
              className="gap-2"
              variant="default"
            >
              <Send className="w-4 h-4" />
              Request Withdrawal
            </Button>
          )}
          {isOwner && (
            <Button 
              onClick={() => setTeamModalOpen(true)} 
              className="gap-2"
              variant="outline"
            >
              <Users className="w-4 h-4" />
              Manage Team
            </Button>
          )}
        </div>
      )}

      {/* Withdrawal Requests */}
      <section className="space-y-4">
        <h3 className="text-xl font-light text-primary/80">Withdrawal Requests</h3>
        <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md">
          <WithdrawalRequestsList vaultAddress={selectedVault} />
        </div>
      </section>

      {/* Modals */}
      {selectedVault && (
        <>
          <TeamManagementModal
            open={teamModalOpen}
            onOpenChange={setTeamModalOpen}
            vaultAddress={selectedVault}
          />
          {vault && (
            <WithdrawalRequestModal
              open={withdrawalModalOpen}
              onOpenChange={setWithdrawalModalOpen}
              vaultAddress={selectedVault}
              vaultData={{
                txLimit: vault.txLimit,
                largeWithdrawalThreshold: vault.largeWithdrawalThreshold,
                delayHours: vault.delayHours,
                withdrawalCount: vault.withdrawalCount,
              }}
              onSuccess={handleRefresh}
            />
          )}
        </>
      )}
    </>
  );
}
