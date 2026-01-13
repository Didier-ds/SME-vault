"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useProgram } from "@/src/hooks";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { 
  Loader2, 
  Plus, 
  X, 
  Vault as VaultIcon,
  Coins,
  Users,
  Shield
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Default USDC Devnet Mint Address
const DEFAULT_MINT = "Cs9XJ317LyuWhxe3DEsA4RCZuHtj8DjNgFJ29VqrKYX9";

interface TeamMember {
  address: string;
  label: string;
}

interface VaultFormData {
  name: string;
  approvalThreshold: string;
  dailyLimit: string;
  txLimit: string;
  largeWithdrawalThreshold: string;
  delayHours: string;
  tokenMint: string;
  approvers: TeamMember[];
  staff: TeamMember[];
}

export default function CreateVaultPage() {
  const router = useRouter();
  const { program, connected } = useProgram();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<VaultFormData>({
    name: "",
    approvalThreshold: "2",
    dailyLimit: "10000",
    txLimit: "5000",
    largeWithdrawalThreshold: "3000",
    delayHours: "24",
    tokenMint: DEFAULT_MINT,
    approvers: [],
    staff: [],
  });

  const [newApprover, setNewApprover] = useState({ address: "", label: "" });
  const [newStaff, setNewStaff] = useState({ address: "", label: "" });

  const handleChange = (field: keyof VaultFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addApprover = () => {
    if (!newApprover.address) return;
    try {
      new PublicKey(newApprover.address);
      setFormData((prev) => ({
        ...prev,
        approvers: [...prev.approvers, newApprover],
      }));
      setNewApprover({ address: "", label: "" });
      setError(null);
    } catch {
      setError("Invalid approver address");
    }
  };
 
  const removeApprover = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index),
    }));
  };

  const addStaff = () => {
    if (!newStaff.address) return;
    try {
      new PublicKey(newStaff.address);
      setFormData((prev) => ({
        ...prev,
        staff: [...prev.staff, newStaff],
      }));
      setNewStaff({ address: "", label: "" });
      setError(null);
    } catch {
      setError("Invalid staff address");
    }
  };

  const removeStaff = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== index),
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const createVault = async () => {
    if (!program || !connected) {
      setError("Please connect your wallet first");
      return;
    }

    // Validation
    if (!formData.name || formData.name.length > 50) {
      setError("Vault name is required (max 50 characters)");
      return;
    }

    if (parseInt(formData.approvalThreshold) < 1) {
      setError("Approval threshold must be at least 1");
      return;
    }

    try {
      new PublicKey(formData.tokenMint);
    } catch {
      setError("Invalid token mint address");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const provider = program.provider as anchor.AnchorProvider;
      const owner = provider.wallet.publicKey;

      // Derive vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), owner.toBuffer(), Buffer.from(formData.name)],
        program.programId
      );

      // Derive vault token account
      const tokenMint = new PublicKey(formData.tokenMint);
      const vaultTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        vaultPda,
        true
      );

      console.log("Creating vault:");
      console.log("Vault PDA:", vaultPda.toString());
      console.log("Token Mint:", tokenMint.toString());
      console.log("Token Account:", vaultTokenAccount.toString());

      // Fetch token mint info to get decimals dynamically
      const mintInfo = await provider.connection.getParsedAccountInfo(tokenMint);
      const mintData = mintInfo.value?.data;
      const decimals = (mintData && 'parsed' in mintData) ? mintData.parsed.info.decimals : 6;
      const decimalMultiplier = Math.pow(10, decimals);
      
      console.log(`Token decimals: ${decimals}, multiplier: ${decimalMultiplier}`);

      // 1. Create vault (convert limits using actual token decimals)
      const createTx = await program.methods
        .createVault(
          formData.name,
          parseInt(formData.approvalThreshold),
          new anchor.BN(parseFloat(formData.dailyLimit) * decimalMultiplier),
          new anchor.BN(parseFloat(formData.txLimit) * decimalMultiplier),
          new anchor.BN(parseFloat(formData.largeWithdrawalThreshold) * decimalMultiplier),
          new anchor.BN(formData.delayHours)
        )
        .accountsPartial({
          vault: vaultPda,
          tokenMint: tokenMint,
          vaultTokenAccount: vaultTokenAccount,
          owner: owner,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ Vault created:", createTx);
      setSuccess("Vault created successfully!");

      // 2. Add approvers
      for (const approver of formData.approvers) {
        try {
          const approverPubkey = new PublicKey(approver.address);
          await program.methods
            .addApprover(approverPubkey)
            .accountsPartial({
              vault: vaultPda,
              owner: owner,
            })
            .rpc();
          console.log(`✅ Added approver: ${approver.label || approver.address}`);
        } catch (err) {
          console.error(`⚠️ Failed to add approver ${approver.address}:`, err);
        }
      }

      // 3. Add staff
      for (const staffMember of formData.staff) {
        try {
          const staffPubkey = new PublicKey(staffMember.address);
          await program.methods
            .addStaff(staffPubkey)
            .accountsPartial({
              vault: vaultPda,
              owner: owner,
            })
            .rpc();
          console.log(`✅ Added staff: ${staffMember.label || staffMember.address}`);
        } catch (err) {
          console.error(`⚠️ Failed to add staff ${staffMember.address}:`, err);
        }
      }

      // Redirect to dashboard
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      console.error("Error creating vault:", err);
      setError(err instanceof Error ? err.message : "Failed to create vault");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-thin font-display text-primary flex items-center gap-3">
          <VaultIcon className="w-10 h-10" />
          Create New Vault
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your secure multi-signature treasury
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* 1. Vault Details */}
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <VaultIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Vault Details</h2>
              <p className="text-sm text-muted-foreground">Basic configuration and limits</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Vault Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Company Treasury"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Approval Threshold *</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                max="10"
                value={formData.approvalThreshold}
                onChange={(e) => handleChange("approvalThreshold", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">M-of-N signatures required</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delayHours">Time Delay (hours)</Label>
              <Input
                id="delayHours"
                type="number"
                min="0"
                value={formData.delayHours}
                onChange={(e) => handleChange("delayHours", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">For large withdrawals</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Limit (USDC)</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="0"
                value={formData.dailyLimit}
                onChange={(e) => handleChange("dailyLimit", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txLimit">Transaction Limit (USDC)</Label>
              <Input
                id="txLimit"
                type="number"
                min="0"
                value={formData.txLimit}
                onChange={(e) => handleChange("txLimit", e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="largeThreshold">Large Withdrawal Threshold (USDC)</Label>
              <Input
                id="largeThreshold"
                type="number"
                min="0"
                value={formData.largeWithdrawalThreshold}
                onChange={(e) => handleChange("largeWithdrawalThreshold", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Withdrawals above this amount trigger the time delay
              </p>
            </div>
          </div>
        </Card>

        {/* 2. Token Settings */}
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Token Settings</h2>
              <p className="text-sm text-muted-foreground">Which token will this vault hold?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenMint">Token Mint Address *</Label>
            <Input
              id="tokenMint"
              placeholder="Token mint public key"
              value={formData.tokenMint}
              onChange={(e) => handleChange("tokenMint", e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Default: Custom USDC on Solana Devnet
            </p>
          </div>
        </Card>

        {/* 3. Team Members */}
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Team Members</h2>
              <p className="text-sm text-muted-foreground">Add approvers and staff (optional)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Approvers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Approvers
                </h3>
                <span className="text-sm text-muted-foreground">
                  {formData.approvers.length}/10
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Can approve withdrawal requests
              </p>

              {/* Approvers List */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {formData.approvers.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                    No approvers yet
                  </div>
                ) : (
                  formData.approvers.map((approver, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {approver.label || "Approver"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {formatAddress(approver.address)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeApprover(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Approver */}
              <Separator />
              <div className="space-y-2">
                <Input
                  placeholder="Wallet address"
                  value={newApprover.address}
                  onChange={(e) =>
                    setNewApprover({ ...newApprover, address: e.target.value })
                  }
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Label (optional)"
                  value={newApprover.label}
                  onChange={(e) =>
                    setNewApprover({ ...newApprover, label: e.target.value })
                  }
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={addApprover}
                  disabled={!newApprover.address}
                >
                  <Plus className="w-4 h-4" />
                  Add Approver
                </Button>
              </div>
            </div>

            {/* Staff */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Staff
                </h3>
                <span className="text-sm text-muted-foreground">
                  {formData.staff.length}/20
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Can initiate withdrawal requests
              </p>

              {/* Staff List */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {formData.staff.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                    No staff yet
                  </div>
                ) : (
                  formData.staff.map((staffMember, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {staffMember.label || "Staff"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {formatAddress(staffMember.address)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStaff(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Staff */}
              <Separator />
              <div className="space-y-2">
                <Input
                  placeholder="Wallet address"
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Label (optional)"
                  value={newStaff.label}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, label: e.target.value })
                  }
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={addStaff}
                  disabled={!newStaff.address}
                >
                  <Plus className="w-4 h-4" />
                  Add Staff
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 sticky bottom-6">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={createVault}
            disabled={loading || !connected}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Vault...
              </>
            ) : (
              <>
                <VaultIcon className="w-4 h-4" />
                Create Vault
              </>
            )}
          </Button>
        </div>

        {!connected && (
          <p className="text-center text-sm text-muted-foreground">
            Please connect your wallet to create a vault
          </p>
        )}
      </div>
    </>
  );
}
