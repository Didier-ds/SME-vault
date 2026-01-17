"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVaultContext } from "@/src/contexts/VaultContext";
import { useWithdrawals, useVaultTransactions } from "@/src/hooks";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AlertCircle, ArrowLeft, Activity, ExternalLink, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { WithdrawalStatus } from "@/src/hooks/useWithdrawals";
import * as anchor from "@coral-xyz/anchor";

interface TransactionActivity {
  id: string;
  type: "withdrawal_request" | "withdrawal_approval" | "withdrawal_execution" | "withdrawal_rejection" | "deposit" | "withdrawal" | "program_instruction" | "unknown";
  timestamp: number;
  signature?: string;
  withdrawalPublicKey?: PublicKey;
  amount?: anchor.BN | number;
  actor?: PublicKey;
  description: string;
  status?: WithdrawalStatus;
  solscanUrl?: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const { selectedVaultAddress, selectedVault, vaultsLoading, tokenMint, tokenDecimals } = useVaultContext();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const { withdrawals, loading: withdrawalsLoading, error: withdrawalsError } = useWithdrawals(
    selectedVaultAddress || undefined
  );

  const { transactions: blockchainTransactions, loading: transactionsLoading, error: transactionsError } = useVaultTransactions(
    selectedVaultAddress || undefined,
    tokenMint
  );

  const loading = withdrawalsLoading || transactionsLoading || vaultsLoading;
  const error = withdrawalsError || transactionsError;

  // Build transaction activity from withdrawals and blockchain transactions
  const activities = useMemo<TransactionActivity[]>(() => {
    const activityList: TransactionActivity[] = [];

    // Add blockchain transactions (deposits, withdrawals, etc.)
    blockchainTransactions.forEach((tx) => {
      activityList.push({
        id: tx.signature,
        type: tx.type,
        timestamp: tx.timestamp,
        signature: tx.signature,
        amount: tx.amount,
        description: tx.description,
        solscanUrl: `https://solscan.io/tx/${tx.signature}?cluster=devnet`,
      });
    });

    // Add withdrawal-related activities
    if (withdrawals && withdrawals.length > 0) {

    withdrawals.forEach((withdrawal) => {
      // Add withdrawal request activity
      activityList.push({
        id: `${withdrawal.publicKey.toString()}-request`,
        type: "withdrawal_request",
        timestamp: withdrawal.createdAt.toNumber(),
        withdrawalPublicKey: withdrawal.publicKey,
        amount: withdrawal.amount,
        actor: withdrawal.requester,
        description: `Requested withdrawal of ${(withdrawal.amount.toNumber() / Math.pow(10, tokenDecimals || 6)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
        status: withdrawal.status,
      });

      // Add approval activities
      withdrawal.approvals.forEach((approver, index) => {
        activityList.push({
          id: `${withdrawal.publicKey.toString()}-approval-${index}`,
          type: "withdrawal_approval",
          timestamp: withdrawal.createdAt.toNumber() + index + 1, // Approvals happen after request
          withdrawalPublicKey: withdrawal.publicKey,
          amount: withdrawal.amount,
          actor: approver,
          description: `Approved withdrawal request`,
          status: withdrawal.status,
        });
      });

      // Add execution activity if executed
      if (withdrawal.status === WithdrawalStatus.Executed && withdrawal.executedAt) {
        activityList.push({
          id: `${withdrawal.publicKey.toString()}-execution`,
          type: "withdrawal_execution",
          timestamp: withdrawal.executedAt.toNumber(),
          withdrawalPublicKey: withdrawal.publicKey,
          amount: withdrawal.amount,
          actor: withdrawal.requester, // Executor is typically the requester or staff
          description: `Executed withdrawal of ${(withdrawal.amount.toNumber() / Math.pow(10, tokenDecimals || 6)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
          status: withdrawal.status,
        });
      }

      // Add rejection activity if rejected
      if (withdrawal.status === WithdrawalStatus.Rejected) {
        activityList.push({
          id: `${withdrawal.publicKey.toString()}-rejection`,
          type: "withdrawal_rejection",
          timestamp: withdrawal.createdAt.toNumber() + 100, // Rejection happens after request
          withdrawalPublicKey: withdrawal.publicKey,
          amount: withdrawal.amount,
          actor: withdrawal.requester, // Would need actual rejector from contract
          description: `Rejected withdrawal request`,
          status: withdrawal.status,
        });
      }
    });

    }

    // Sort by timestamp (newest first)
    return activityList.sort((a, b) => b.timestamp - a.timestamp);
  }, [withdrawals, blockchainTransactions, tokenDecimals]);

  const formatAddress = (address: PublicKey) => {
    const str = address.toString();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: TransactionActivity["type"]): string | React.ReactNode => {
    switch (type) {
      case "withdrawal_request":
        return "📝";
      case "withdrawal_approval":
        return "✅";
      case "withdrawal_execution":
        return "💸";
      case "withdrawal_rejection":
        return "❌";
      case "deposit":
        return <ArrowDown className="w-5 h-5" />;
      case "withdrawal":
        return <ArrowUp className="w-5 h-5" />;
      case "program_instruction":
        return "⚙️";
      default:
        return "📋";
    }
  };

  const getActivityColor = (type: TransactionActivity["type"]) => {
    switch (type) {
      case "withdrawal_request":
        return "text-blue-500";
      case "withdrawal_approval":
        return "text-green-500";
      case "withdrawal_execution":
        return "text-purple-500";
      case "withdrawal_rejection":
        return "text-red-500";
      case "deposit":
        return "text-green-500";
      case "withdrawal":
        return "text-red-500";
      case "program_instruction":
        return "text-indigo-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (!selectedVaultAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">No vault selected</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

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
            Activity
          </h1>
          <p className="text-muted-foreground mt-2">
            All transactions and events for {selectedVault?.name || "this vault"}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {loading || vaultsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
          </Card>
        ) : activities.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Transactions will appear here once they occur
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const solscanUrl = activity.solscanUrl || 
                (activity.signature 
                  ? `https://solscan.io/tx/${activity.signature}?cluster=devnet`
                  : activity.withdrawalPublicKey 
                    ? `https://solscan.io/account/${activity.withdrawalPublicKey.toString()}?cluster=devnet`
                    : "#");
              
              return (
                <Card
                  key={activity.id}
                  className="p-6 border-border/50 bg-card/50 backdrop-blur-xl hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`${getActivityColor(activity.type)} flex items-center justify-center w-10 h-10 rounded-full bg-current/10`}>
                      {typeof getActivityIcon(activity.type) === 'string' ? (
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      ) : (
                        getActivityIcon(activity.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {activity.actor && (
                              <>
                                <span>By: {formatAddress(activity.actor)}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{formatDate(activity.timestamp)}</span>
                            {activity.signature && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-xs">
                                  {activity.signature.slice(0, 8)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* View on Solscan */}
                        {solscanUrl !== "#" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="shrink-0"
                          >
                            <a
                              href={solscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

