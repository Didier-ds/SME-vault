import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// Vault list item (summary) - kept for backward compatibility
export interface VaultInfo {
  address: string;
  name: string;
  owner: PublicKey;
  approvalThreshold: number;
  staffCount: number;
  approverCount: number;
}

// Full vault data (from blockchain)
export interface VaultData {
  owner: PublicKey;
  tokenMint: PublicKey;
  name: string;
  approvers: PublicKey[];
  staff: PublicKey[];
  approvalThreshold: number;
  dailyLimit: BN;
  txLimit: BN;
  largeWithdrawalThreshold: BN;
  delayHours: BN;
  frozen: boolean;
  createdAt: BN;
  bump: number;
  withdrawalCount: BN;
}

// Vault with address (used in context)
export interface VaultWithMetadata extends VaultData {
  address: string;
}

// Context type - Single source of truth for vault data
export interface VaultContextType {
  // Vault selection
  selectedVaultAddress: string | null;
  setSelectedVault: (address: string | null) => void;
  vaults: VaultWithMetadata[]; // Full vault data for all vaults
  vaultsLoading: boolean;

  // Selected vault (computed from vaults array)
  selectedVault: VaultWithMetadata | null;
  vaultBalance: number; // Only this needs separate fetch
  vaultTokenAccount: string | null;
  balanceLoading: boolean;
  vaultError: string | null;
  refetchVaults: () => void;
  refetchBalance: () => void;

  // Computed token properties
  tokenMint: PublicKey | null;
  tokenDecimals: number;
  decimalMultiplier: number;
  decimalDivisor: number;
}

