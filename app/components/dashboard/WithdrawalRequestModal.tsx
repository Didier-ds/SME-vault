"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useProgram } from "@/src/hooks";

interface WithdrawalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultAddress: string;
  vaultData: {
    txLimit: anchor.BN;
    largeWithdrawalThreshold: anchor.BN;
    delayHours: anchor.BN;
    withdrawalCount: anchor.BN;
  };
  onSuccess?: () => void;
}

export function WithdrawalRequestModal({
  open,
  onOpenChange,
  vaultAddress,
  vaultData,
  onSuccess,
}: WithdrawalRequestModalProps) {
  const { program } = useProgram();
  const { decimalMultiplier } = useVaultContext();

  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLargeWithdrawal =
    amount && parseFloat(amount) >= vaultData.largeWithdrawalThreshold.toNumber();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!program) {
      setError("Please connect your wallet");
      return;
    }

    // Validation
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountNum > vaultData.txLimit.toNumber()) {
      setError(`Amount exceeds transaction limit (${vaultData.txLimit.toString()} USDC)`);
      return;
    }

    try {
      new PublicKey(destination);
    } catch {
      setError("Invalid destination address");
      return;
    }

    if (!reason || reason.length > 200) {
      setError("Reason is required (max 200 characters)");
      return;
    }

    setLoading(true);

    try {
      const provider = program.provider as anchor.AnchorProvider;
      const requester = provider.wallet.publicKey;
      const vaultPubkey = new PublicKey(vaultAddress);
      const destinationPubkey = new PublicKey(destination);

      // Derive withdrawal PDA
      const [withdrawalPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("withdrawal"),
          vaultPubkey.toBuffer(),
          vaultData.withdrawalCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Fetch vault to get token mint
      const vaultAccount = await program.account.vault.fetch(vaultPubkey);
      const tokenMint = vaultAccount.tokenMint || new PublicKey("Cs9XJ317LyuWhxe3DEsA4RCZuHtj8DjNgFJ29VqrKYX9");
      
      // Fetch token mint info to get decimals dynamically
      const mintInfo = await provider.connection.getParsedAccountInfo(tokenMint);
      const mintData = mintInfo.value?.data;
      const decimals = (mintData && 'parsed' in mintData) ? mintData.parsed.info.decimals : 6;
      const decimalMultiplier = Math.pow(10, decimals);
      
      console.log(`Token decimals: ${decimals}, multiplier: ${decimalMultiplier}`);

      const tx = await program.methods
        .requestWithdrawal(
          new anchor.BN(amountNum * decimalMultiplier), // Convert using actual token decimals
          destinationPubkey,
          reason
        )
        .accountsPartial({
          withdrawal: withdrawalPda,
          vault: vaultPubkey,
          requester: requester,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Withdrawal request created:", tx);

      // Reset form
      setAmount("");
      setDestination("");
      setReason("");

      // Close modal and refresh
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      setError(err instanceof Error ? err.message : "Failed to create withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Send className="w-6 h-6" />
            Request Withdrawal
          </DialogTitle>
          <DialogDescription>
            Create a new withdrawal request from the vault
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">
              Transaction limit: {vaultData.txLimit.toString()} USDC
            </p>
          </div>

          {isLargeWithdrawal && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-500">
                <p className="font-medium">Large Withdrawal</p>
                <p className="text-amber-500/80">
                  This withdrawal will require a {vaultData.delayHours.toString()}-hour time
                  delay after approval.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="destination">Destination Address *</Label>
            <Input
              id="destination"
              placeholder="Recipient wallet address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <textarea
              id="reason"
              placeholder="e.g., Marketing expenses Q1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={3}
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/200 characters
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Create Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
