export enum WithdrawalStatus {
  Pending = "Pending",
  Approved = "Approved",
  Executed = "Executed",
  Rejected = "Rejected"
}

export interface WithdrawalRequest {
  publicKey: string;
  vault: string;
  requester: string;
  destination: string;
  amount: number; // Already converted from BN to decimal
  reason: string;
  status: WithdrawalStatus;
  approvals: string[];
  createdAt: number; // Unix timestamp
  delayUntil: number | null; // Unix timestamp or null
  executedAt: number | null; // Unix timestamp or null
}
