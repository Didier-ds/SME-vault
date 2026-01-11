"use client";

import { useWithdrawalRequests } from "../../src/hooks";
import { WithdrawalRequestCard } from "./WithdrawalRequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox } from "lucide-react";

interface WithdrawalRequestsListProps {
  vaultAddress: string | null;
}

export function WithdrawalRequestsList({ vaultAddress }: WithdrawalRequestsListProps) {
  const { requests, loading, error } = useWithdrawalRequests(vaultAddress || undefined);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full bg-white/5" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
        <div className="text-lg font-light text-red-500/70">Failed to load withdrawal requests</div>
        <div className="text-sm text-muted-foreground mt-2">{error}</div>
      </div>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <div className="text-lg font-light text-muted-foreground">No withdrawal requests yet</div>
        <div className="text-sm text-muted-foreground/70 mt-2">
          Withdrawal requests will appear here once created
        </div>
      </div>
    );
  }

  // Display requests
  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <WithdrawalRequestCard key={request.publicKey} request={request} />
      ))}
    </div>
  );
}
