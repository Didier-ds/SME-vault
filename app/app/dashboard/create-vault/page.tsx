"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useProgram } from "@/src/hooks";

export default function CreateVaultPage() {
  const router = useRouter();
  const { program, connected } = useProgram();
  
  const [formData, setFormData] = useState({
    name: "",
    approvalThreshold: "2",
    dailyLimit: "10000",
    txLimit: "5000",
    largeWithdrawalThreshold: "3000",
    delayHours: "24",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!program || !connected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = program.provider as anchor.AnchorProvider;
      const owner = provider.wallet.publicKey;

      // Derive vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          owner.toBuffer(),
          Buffer.from(formData.name),
        ],
        program.programId
      );

      // Create vault transaction
      const tx = await program.methods
        .createVault(
          formData.name,
          parseInt(formData.approvalThreshold),
          new anchor.BN(formData.dailyLimit),
          new anchor.BN(formData.txLimit),
          new anchor.BN(formData.largeWithdrawalThreshold),
          new anchor.BN(formData.delayHours)
        )
        .accountsPartial({
          vault: vaultPda,
          owner: owner,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Vault created! Signature:", tx);
      
      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      console.error("Error creating vault:", err);
      setError(err instanceof Error ? err.message : "Failed to create vault");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-thin font-display text-primary">
          Create New Vault
        </h1>
        <p className="text-muted-foreground mt-2">
          Set up a secure multi-signature treasury for your organization
        </p>
      </div>

      {/* Form */}
      <Card className="p-8 bg-card/50 backdrop-blur-xl border-border/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vault Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Vault Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Company Treasury"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                A unique name for your vault (1-50 characters)
              </p>
            </div>

            {/* Approval Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold">Approval Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                max="10"
                placeholder="2"
                value={formData.approvalThreshold}
                onChange={(e) => handleChange("approvalThreshold", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Number of approvers required to execute a withdrawal (M-of-N)
              </p>
            </div>

            {/* Daily Limit */}
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Limit (USDC)</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="0"
                placeholder="10000"
                value={formData.dailyLimit}
                onChange={(e) => handleChange("dailyLimit", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum amount that can be withdrawn per day
              </p>
            </div>

            {/* Transaction Limit */}
            <div className="space-y-2">
              <Label htmlFor="txLimit">Transaction Limit (USDC)</Label>
              <Input
                id="txLimit"
                type="number"
                min="0"
                placeholder="5000"
                value={formData.txLimit}
                onChange={(e) => handleChange("txLimit", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum amount per single transaction
              </p>
            </div>

            {/* Large Withdrawal Threshold */}
            <div className="space-y-2">
              <Label htmlFor="largeThreshold">Large Withdrawal Threshold (USDC)</Label>
              <Input
                id="largeThreshold"
                type="number"
                min="0"
                placeholder="3000"
                value={formData.largeWithdrawalThreshold}
                onChange={(e) => handleChange("largeWithdrawalThreshold", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Withdrawals above this amount trigger time delay
              </p>
            </div>

            {/* Delay Hours */}
            <div className="space-y-2">
              <Label htmlFor="delayHours">Time Delay (hours)</Label>
              <Input
                id="delayHours"
                type="number"
                min="0"
                placeholder="24"
                value={formData.delayHours}
                onChange={(e) => handleChange("delayHours", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Delay period for large withdrawals after approval
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={loading || !connected}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Vault...
                  </>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </div>

            {!connected && (
              <p className="text-center text-sm text-muted-foreground">
                Please connect your wallet to create a vault
              </p>
            )}
          </form>
        </Card>
    </>
  );
}
