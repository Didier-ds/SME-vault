"use client";

import { useEffect, useState } from "react";
import { useProgram } from "./useProgram";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export enum WithdrawalStatus {
  Pending = "Pending",
  Approved = "Approved",
  Executed = "Executed",
  Rejected = "Rejected",
}

export interface WithdrawalRequest {
  publicKey: PublicKey;
  vault: PublicKey;
  amount: BN;
  destination: PublicKey;
  requester: PublicKey;
  reason: string;
  approvals: PublicKey[];
  status: WithdrawalStatus;
  createdAt: BN;
  delayUntil: BN | null;
  executedAt: BN | null;
  bump: number;
}

export function  useWithdrawals(vaultAddress?: string) {
  const { program } = useProgram();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!program || !vaultAddress) return;

    const fetchWithdrawals = async () => {
      setLoading(true);
      setError(null);

      try {
        const vaultPubkey = new PublicKey(vaultAddress);

        // Fetch all withdrawal accounts for this vault
        const allWithdrawals = await program.account.withdrawalRequest.all([
          {
            memcmp: {
              offset: 8, // After discriminator
              bytes: vaultPubkey.toBase58(),
            },
          },
        ]);

        const formattedWithdrawals: WithdrawalRequest[] = allWithdrawals.map(
          (w) => ({
            publicKey: w.publicKey,
            vault: w.account.vault,
            amount: w.account.amount,
            destination: w.account.destination,
            requester: w.account.requester,
            reason: w.account.reason,
            approvals: w.account.approvals,
            status: mapStatus(w.account.status),
            createdAt: w.account.createdAt,
            delayUntil: w.account.delayUntil,
            executedAt: w.account.executedAt,
            bump: w.account.bump,
          })
        );

        // Sort by created date (newest first)
        formattedWithdrawals.sort((a, b) => {
          return b.createdAt.toNumber() - a.createdAt.toNumber();
        });

        setWithdrawals(formattedWithdrawals);
      } catch (err) {
        console.error("Error fetching withdrawals:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch withdrawals"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [program, vaultAddress]);

  const pending = withdrawals.filter(
    (w) => w.status === WithdrawalStatus.Pending
  );
  const approved = withdrawals.filter(
    (w) => w.status === WithdrawalStatus.Approved
  );
  const executed = withdrawals.filter(
    (w) => w.status === WithdrawalStatus.Executed
  );
  const rejected = withdrawals.filter(
    (w) => w.status === WithdrawalStatus.Rejected
  );

  return {
    withdrawals,
    pending,
    approved,
    executed,
    rejected,
    loading,
    error,
  };
}

// Helper to map status from contract to enum
function mapStatus(status: { pending?: unknown; approved?: unknown; executed?: unknown; rejected?: unknown }): WithdrawalStatus {
  if (status.pending) return WithdrawalStatus.Pending;
  if (status.approved) return WithdrawalStatus.Approved;
  if (status.executed) return WithdrawalStatus.Executed;
  if (status.rejected) return WithdrawalStatus.Rejected;
  return WithdrawalStatus.Pending;
}
