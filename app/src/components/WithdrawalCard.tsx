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
import { useVaultContext } from "@/src/contexts/VaultContext";

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
  const { tokenDecimals } = useVaultContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const config = statusConfig[withdrawal.status];
  const StatusIcon = config.icon;

  const formatAddress = (address: PublicKey) => {
    const str = address.toString();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  const formatDate = (timestamp: anchor.BN) => {
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: anchor.BN) => {
    const decimals = tokenDecimals || 6; // Default to 6 for USDC
    const amountInUsdc = amount.toNumber() / Math.pow(10, decimals);
    return amountInUsdc.toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
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

      // Show success toast with Solscan link
      const solscanUrl = `https://solscan.io/tx/${tx}?cluster=devnet`;
      
      // Dynamic import toast
      const { toast } = await import("sonner");
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

      if (onActionComplete) {
        setTimeout(onActionComplete, 1500);
      }
    } catch (err) {
      console.error("Error approving withdrawal:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to approve";
      setError(errorMessage);
      
      // Dynamic import toast for error
      const { toast } = await import("sonner");
      toast.error("Failed to approve withdrawal", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!program || !currentUserPublicKey) return;

    setLoading(true);
    setError(null);

    try {
      const provider = program.provider as anchor.AnchorProvider;
      
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
        true // allowOwnerOffCurve for vault PDA
      );

      // Get destination token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        withdrawal.destination,
        true // allowOwnerOffCurve in case destination is also a vault PDA
      );

      console.log("Vault Token Account:", vaultTokenAccount.toString());
      console.log("Destination Token Account:", destinationTokenAccount.toString());

      // Check if destination token account exists
      const accountInfo = await provider.connection.getAccountInfo(destinationTokenAccount);
      
      if (!accountInfo) {
        console.log("⚠️ Destination token account doesn't exist, creating it...");
        setError("Creating destination token account...");
        
        const { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
        
        const createAtaIx = createAssociatedTokenAccountInstruction(
          currentUserPublicKey, // payer
          destinationTokenAccount, // ata address
          withdrawal.destination, // owner (can be PDA)
          tokenMint, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
        const signature = await provider.sendAndConfirm(createAtaTx);
        
        console.log("✅ Created destination token account:", signature);
        setError(null); // Clear the status message
      }

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
      
      // Show success toast with Solscan link
      const solscanUrl = `https://solscan.io/tx/${tx}?cluster=devnet`;
      
      // Dynamic import toast
      const { toast } = await import("sonner");
      toast.success("Withdrawal executed successfully!", {
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

      if (onActionComplete) {
        setTimeout(onActionComplete, 1500);
      }
    } catch (err) {
      console.error("Error executing withdrawal:", err);
      
      // Dynamic import toast for error
      const { toast } = await import("sonner");
      toast.error(err instanceof Error ? err.message : "Failed to execute");
      
      setError(err instanceof Error ? err.message : "Failed to execute");
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
              ${formatAmount(withdrawal.amount)}
            </div>
            <Badge className={`${config.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>

          {/* Reason */}
          {withdrawal.reason && (
            <div className="text-sm text-muted-foreground">
              {withdrawal.reason}
            </div>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
            <div>
              To: <span className="text-primary/70">{formatAddress(withdrawal.destination)}</span>
            </div>
            <div>
              By: <span className="text-primary/70">{formatAddress(withdrawal.requester)}</span>
            </div>
            {withdrawal.approvals.length > 0 && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {withdrawal.approvals.length}/{vaultData.approvalThreshold} approval{withdrawal.approvals.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Approval Progress Bar */}
          {withdrawal.status === WithdrawalStatus.Pending && (
            <div className="space-y-1 pt-1">
              <div className="w-full bg-muted/50 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((withdrawal.approvals.length / vaultData.approvalThreshold) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Time Delay */}
          {withdrawal.delayUntil && withdrawal.status === WithdrawalStatus.Approved && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 text-yellow-500" />
              <span>{getTimeRemaining(withdrawal.delayUntil)}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-500 p-2 bg-red-500/10 border border-red-500/20 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Right side: Timestamp and Actions */}
        <div className="text-right space-y-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Created</div>
            <div className="font-mono">{formatDate(withdrawal.createdAt)}</div>
            
            {withdrawal.executedAt && (
              <>
                <div className="mt-2">Executed</div>
                <div className="font-mono text-green-500/70">{formatDate(withdrawal.executedAt)}</div>
              </>
            )}
            
            {withdrawal.delayUntil && !withdrawal.executedAt && (
              <>
                <div className="mt-2">Executable after</div>
                <div className="font-mono text-yellow-500/70">{formatDate(withdrawal.delayUntil)}</div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
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
            {canExecute && (
              <Button
                onClick={handleExecute}
                disabled={loading}
                size="sm"
                variant="default"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Execute
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
