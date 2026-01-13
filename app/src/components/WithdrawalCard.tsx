"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Send,
} from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useProgram } from "@/src/hooks";
import { WithdrawalRequest, WithdrawalStatus } from "@/src/hooks/useWithdrawals";
import { getAssociatedTokenAddress } from "@solana/spl-token";

interface WithdrawalCardProps {
  withdrawal: WithdrawalRequest;
  vaultData: {
    approvalThreshold: number;
    owner: PublicKey;
    name: string;
    bump: number;
  };
  tokenMint: PublicKey;
  currentUserIsApprover: boolean;
  currentUserPublicKey?: PublicKey;
  onActionComplete?: () => void;
}

export function WithdrawalCard({
  withdrawal,
  vaultData,
  tokenMint,
  currentUserIsApprover,
  currentUserPublicKey,
  onActionComplete,
}: WithdrawalCardProps) {
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusConfig = {
    [WithdrawalStatus.Pending]: {
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "Pending",
    },
    [WithdrawalStatus.Approved]: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      label: "Approved",
    },
    [WithdrawalStatus.Executed]: {
      icon: CheckCircle2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      label: "Executed",
    },
    [WithdrawalStatus.Rejected]: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "Rejected",
    },
  };

  const config = statusConfig[withdrawal.status];
  const StatusIcon = config.icon;

  const formatAddress = (address: PublicKey) => {
    const str = address.toString();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  const formatDate = (timestamp: anchor.BN) => {
    const date = new Date(timestamp.toNumber() * 1000);
    return date.toLocaleString();
  };

  const getTimeRemaining = (delayUntil: anchor.BN) => {
    const now = Date.now() / 1000;
    const delay = delayUntil.toNumber();
    const diff = delay - now;

    if (diff <= 0) return "Ready to execute";

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    return `${hours}h ${minutes}m remaining`;
  };

  const canApprove =
    currentUserIsApprover &&
    currentUserPublicKey &&
    withdrawal.status === WithdrawalStatus.Pending &&
    !withdrawal.approvals.some((a) => a.equals(currentUserPublicKey)) &&
    !withdrawal.requester.equals(currentUserPublicKey);

  const canExecute =
    withdrawal.status === WithdrawalStatus.Approved &&
    (!withdrawal.delayUntil ||
      Date.now() / 1000 >= withdrawal.delayUntil.toNumber());

  const handleApprove = async () => {
    if (!program || !currentUserPublicKey) return;

    setLoading(true);
    setError(null);

    try {
      const tx = await program.methods
        .approveWithdrawal()
        .accountsPartial({
          withdrawal: withdrawal.publicKey,
          vault: withdrawal.vault,
          approver: currentUserPublicKey,
        })
        .rpc();

      console.log("✅ Withdrawal approved:", tx);

      if (onActionComplete) {
        setTimeout(onActionComplete, 1500);
      }
    } catch (err) {
      console.error("Error approving withdrawal:", err);
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!program || !currentUserPublicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Derive vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          vaultData.owner.toBuffer(),
          Buffer.from(vaultData.name),
        ],
        program.programId
      );

      // Get vault token account
      const vaultTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        vaultPda,
        true
      );

      // Get destination token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        withdrawal.destination,
        true
      );

      const tx = await program.methods
        .executeWithdrawal()
        .accountsPartial({
          withdrawal: withdrawal.publicKey,
          vault: withdrawal.vault,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          vaultAuthority: vaultPda,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          executor: currentUserPublicKey,
        })
        .rpc();

      console.log("✅ Withdrawal executed:", tx);

      if (onActionComplete) {
        setTimeout(onActionComplete, 1500);
      }
    } catch (err) {
      console.error("Error executing withdrawal:", err);
      setError(err instanceof Error ? err.message : "Failed to execute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`p-5 border ${config.border} ${config.bg} backdrop-blur-xl`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
            <Badge variant="outline" className={`${config.color} border-current`}>
              {config.label}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">
              {withdrawal.amount.toString()} USDC
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(withdrawal.createdAt)}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Destination:</span>
            <span className="font-mono">{formatAddress(withdrawal.destination)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Requested by:</span>
            <span className="font-mono">{formatAddress(withdrawal.requester)}</span>
          </div>
          {withdrawal.reason && (
            <div>
              <span className="text-muted-foreground">Reason:</span>
              <p className="mt-1 text-foreground">{withdrawal.reason}</p>
            </div>
          )}
        </div>

        {/* Approval Progress */}
        {withdrawal.status === WithdrawalStatus.Pending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Approvals
              </span>
              <span className="font-medium">
                {withdrawal.approvals.length}/{vaultData.approvalThreshold}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(withdrawal.approvals.length / vaultData.approvalThreshold) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Time Delay */}
        {withdrawal.delayUntil && withdrawal.status === WithdrawalStatus.Approved && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">
              {getTimeRemaining(withdrawal.delayUntil)}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-500 p-2 bg-red-500/10 border border-red-500/20 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Approve
                </>
              )}
            </Button>
          )}
          {canExecute && (
            <Button
              onClick={handleExecute}
              disabled={loading}
              variant="default"
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Execute
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
