"use client";

import { useEffect, useState } from "react";
import { useProgram } from "./useProgram";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { WithdrawalRequest, WithdrawalStatus } from "../types/withdrawal";

export function useWithdrawalRequests(vaultAddress?: string) {
  const { program } = useProgram();
  const { connection } = useConnection();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!program || !vaultAddress) {
      setRequests([]);
      return;
    }

    const fetchWithdrawalRequests = async () => {
      setLoading(true);
      setError(null);

      try {
        const vaultPubkey = new PublicKey(vaultAddress);

        // Fetch vault to get withdrawal count
        const vaultAccount = await program.account.vault.fetch(vaultPubkey);
        const withdrawalCount = (vaultAccount.withdrawalCount as BN).toNumber();

        // Fetch token mint decimals for amount conversion
        const tokenMint = new PublicKey("Cs9XJ317LyuWhxe3DEsA4RCZuHtj8DjNgFJ29VqrKYX9");
        const mintInfo = await connection.getParsedAccountInfo(tokenMint);
        const mintData = mintInfo.value?.data;
        const decimals = (mintData && 'parsed' in mintData) ? mintData.parsed.info.decimals : 6;
        const divisor = Math.pow(10, decimals);

        if (withdrawalCount === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        // Generate PDAs for all withdrawal requests
        const requestPromises = [];
        for (let i = 0; i < withdrawalCount; i++) {
          const [withdrawalPda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("withdrawal"),
              vaultPubkey.toBuffer(),
              new BN(i).toArrayLike(Buffer, "le", 8),
            ],
            program.programId
          );

          requestPromises.push(
            program.account.withdrawalRequest
              .fetch(withdrawalPda)
              .then((data) => ({
                publicKey: withdrawalPda.toString(),
                vault: data.vault.toString(),
                requester: data.requester.toString(),
                destination: data.destination.toString(),
                amount: (data.amount as BN).toNumber() / divisor, // Convert using actual token decimals
                reason: data.reason as string,
                status: parseStatus(data.status),
                approvals: (data.approvals as PublicKey[]).map((a) => a.toString()),
                createdAt: (data.createdAt as BN).toNumber(),
                delayUntil: data.delayUntil ? (data.delayUntil as BN).toNumber() : null,
                executedAt: data.executedAt ? (data.executedAt as BN).toNumber() : null,
              }))
              .catch(() => null) // Handle deleted/non-existent requests
          );
        }

        const fetchedRequests = await Promise.all(requestPromises);
        // Filter out null values (failed fetches) and sort by creation date (newest first)
        const validRequests = fetchedRequests
          .filter((r): r is WithdrawalRequest => r !== null)
          .sort((a, b) => b.createdAt - a.createdAt);

        setRequests(validRequests);
      } catch (err) {
        console.error("Error fetching withdrawal requests:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch withdrawal requests");
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalRequests();
  }, [program, vaultAddress, connection]);

  return {
    requests,
    loading,
    error,
  };
}

// Helper function to parse status from Anchor enum
function parseStatus(status: Record<string, unknown>): WithdrawalStatus {
  if ('pending' in status) return WithdrawalStatus.Pending;
  if ('approved' in status) return WithdrawalStatus.Approved;
  if ('executed' in status) return WithdrawalStatus.Executed;
  if ('rejected' in status) return WithdrawalStatus.Rejected;
  return WithdrawalStatus.Pending;
}
