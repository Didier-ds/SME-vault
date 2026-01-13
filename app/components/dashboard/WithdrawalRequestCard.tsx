"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WithdrawalRequest, WithdrawalStatus } from "../../src/types/withdrawal";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertCircle, Shield, Loader2 } from "lucide-react";
import { useProgram, useUserRole } from "../../src/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

interface WithdrawalRequestCardProps {
  request: WithdrawalRequest;
}

export function WithdrawalRequestCard({ request }: WithdrawalRequestCardProps) {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const { isApprover } = useUserRole();
  
  const [loading, setLoading] = useState(false);

  const statusConfig = {
    [WithdrawalStatus.Pending]: {
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      label: "Pending",
    },
    [WithdrawalStatus.Approved]: {
      icon: CheckCircle2,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      label: "Approved",
    },
    [WithdrawalStatus.Executed]: {
      icon: CheckCircle2,
      color: "bg-green-500/10 text-green-500 border-green-500/20",
      label: "Executed",
    },
    [WithdrawalStatus.Rejected]: {
      icon: XCircle,
      color: "bg-red-500/10 text-red-500 border-red-500/20",
      label: "Rejected",
    },
  };

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  // Format address to show first 4 and last 4 characters
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate approval progress
  const approvalProgress = request.approvals.length;

  // Check if current user can approve
  const canApprove =
    isApprover &&
    publicKey &&
    request.status === WithdrawalStatus.Pending &&
    !request.approvals.includes(publicKey.toString()) &&
    request.requester !== publicKey.toString();

  const handleApprove = async () => {
    if (!program || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading(true);

    try {
      const withdrawalPubkey = new PublicKey(request.publicKey);
      const vaultPubkey = new PublicKey(request.vault);

      const tx = await program.methods
        .approveWithdrawal()
        .accountsPartial({
          withdrawal: withdrawalPubkey,
          vault: vaultPubkey,
          approver: publicKey,
        })
        .rpc();

      console.log("✅ Withdrawal approved:", tx);
      
      // Show success toast with Solscan link
      const solscanUrl = `https://solscan.io/tx/${tx}?cluster=devnet`;
      toast.success("Withdrawal approved successfully!", {
        description: (
          <a 
            href={solscanUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            View on Solscan →
          </a>
        ),
      });

      // Refresh page to show update
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Error approving withdrawal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve withdrawal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 border-border/50 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Main info */}
        <div className="flex-1 space-y-2">
          {/* Amount and Status */}
          <div className="flex items-center gap-3">
            <div className="text-2xl font-light text-primary">
              ${request.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <Badge className={`${config.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>

          {/* Reason */}
          {request.reason && (
            <div className="text-sm text-muted-foreground">
              {request.reason}
            </div>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
            <div>
              To: <span className="text-primary/70">{formatAddress(request.destination)}</span>
            </div>
            <div>
              By: <span className="text-primary/70">{formatAddress(request.requester)}</span>
            </div>
            {approvalProgress > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {approvalProgress} approval{approvalProgress !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Timestamp and Actions */}
        <div className="text-right space-y-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Created</div>
            <div className="font-mono">{formatDate(request.createdAt)}</div>
            
            {request.executedAt && (
              <>
                <div className="mt-2">Executed</div>
                <div className="font-mono text-green-500/70">{formatDate(request.executedAt)}</div>
              </>
            )}
            
            {request.delayUntil && !request.executedAt && (
              <>
                <div className="mt-2">Executable after</div>
                <div className="font-mono text-yellow-500/70">{formatDate(request.delayUntil)}</div>
              </>
            )}
          </div>

          {/* Approve button */}
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={loading}
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3" />
                  Approve
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
