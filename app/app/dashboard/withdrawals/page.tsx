"use client";

import { useRouter } from "next/navigation";
import { WithdrawalRequestForm } from "@/src/components/WithdrawalRequestForm";
import { WithdrawalCard } from "@/src/components/WithdrawalCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVaultContext } from "@/src/contexts/VaultContext";
import { useVault, useWithdrawals, useUserRole } from "@/src/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { AlertCircle, Inbox, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicKey } from "@solana/web3.js";

export default function WithdrawalsPage() {
  const router = useRouter();
  const { selectedVault } = useVaultContext();
  const { vault, loading: vaultLoading } = useVault(selectedVault || undefined);
  const { publicKey } = useWallet();
  const { isStaff, isApprover } = useUserRole(selectedVault || undefined);

  const { pending, approved, executed, loading, error } = useWithdrawals(
    selectedVault || undefined
  );

  if (!selectedVault) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">No vault selected</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  // Hardcoded token mint for now - should come from vault data
  const tokenMint = new PublicKey("Cs9XJ317LyuWhxe3DEsA4RCZuHtj8DjNgFJ29VqrKYX9");

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-4xl font-thin font-display text-primary mt-4">
            Withdrawals
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage withdrawal requests for your vault
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Create Withdrawal Request Form (Staff only) */}
        {isStaff && vault && (
          <WithdrawalRequestForm
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

        {/* Pending Withdrawals */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pending Requests</h2>
          {loading || vaultLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : error ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
            </Card>
          ) : pending.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending withdrawal requests</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pending.map((withdrawal) => (
                <WithdrawalCard
                  key={withdrawal.publicKey.toString()}
                  withdrawal={withdrawal}
                  vaultData={{
                    approvalThreshold: vault?.approvalThreshold || 1,
                    owner: vault?.owner || PublicKey.default,
                    name: vault?.name || "",
                    bump: vault?.bump || 0,
                  }}
                  tokenMint={tokenMint}
                  currentUserIsApprover={isApprover}
                  currentUserPublicKey={publicKey || undefined}
                  onActionComplete={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>

        {/* Approved Withdrawals */}
        {approved.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Approved (Ready to Execute)</h2>
            <div className="grid gap-4">
              {approved.map((withdrawal) => (
                <WithdrawalCard
                  key={withdrawal.publicKey.toString()}
                  withdrawal={withdrawal}
                  vaultData={{
                    approvalThreshold: vault?.approvalThreshold || 1,
                    owner: vault?.owner || PublicKey.default,
                    name: vault?.name || "",
                    bump: vault?.bump || 0,
                  }}
                  tokenMint={tokenMint}
                  currentUserIsApprover={isApprover}
                  currentUserPublicKey={publicKey || undefined}
                  onActionComplete={handleRefresh}
                />
              ))}
            </div>
          </div>
        )}

        {/* Executed Withdrawals */}
        {executed.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Completed</h2>
            <div className="grid gap-4">
              {executed.map((withdrawal) => (
                <WithdrawalCard
                  key={withdrawal.publicKey.toString()}
                  withdrawal={withdrawal}
                  vaultData={{
                    approvalThreshold: vault?.approvalThreshold || 1,
                    owner: vault?.owner || PublicKey.default,
                    name: vault?.name || "",
                    bump: vault?.bump || 0,
                  }}
                  tokenMint={tokenMint}
                  currentUserIsApprover={isApprover}
                  currentUserPublicKey={publicKey || undefined}
                  onActionComplete={handleRefresh}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
