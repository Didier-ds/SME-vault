"use client";

import { useState } from "react";
import { useProgram } from "../../src/hooks";
import { useVaultContext } from "../../src/contexts/VaultContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamManagementModal({
  open,
  onOpenChange,
}: TeamManagementModalProps) {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const { selectedVault, vaultsLoading, refetchVaults, selectedVaultAddress } = useVaultContext();

  const [staffInput, setStaffInput] = useState("");
  const [approverInput, setApproverInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Add staff member
  const handleAddStaff = async () => {
    if (!program || !publicKey || !selectedVault || !selectedVaultAddress) return;

    try {
      setLoading(true);

      // Validate address
      const staffPubkey = new PublicKey(staffInput);

      // Check if already in staff
      if (selectedVault.staff.some((s) => s.equals(staffPubkey))) {
        toast.error("Address is already a staff member");
        return;
      }

      // Check max limit
      if (selectedVault.staff.length >= 20) {
        toast.error("Maximum staff limit (20) reached");
        return;
      }

      // Call add_staff instruction
      const vaultPubkey = new PublicKey(selectedVaultAddress);
      const signature = await program.methods
        .addStaff(staffPubkey)
        .accounts({
          vault: vaultPubkey,
          owner: publicKey,
        })
        .rpc();

      console.log("✅ Staff added, tx:", signature);

      toast.success("Staff member added successfully!");
      setStaffInput("");
      
      // Trigger vault data refetch immediately
      console.log("🔄 Triggering global refetch after add staff...");
      refetchVaults();
    } catch (err) {
      console.error("Error adding staff:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add staff member");
    } finally {
      setLoading(false);
    }
  };

  // Add approver
  const handleAddApprover = async () => {
    if (!program || !publicKey || !selectedVault || !selectedVaultAddress) return;

    try {
      setLoading(true);

      // Validate address
      const approverPubkey = new PublicKey(approverInput);

      // Check if already in approvers
      if (selectedVault.approvers.some((a) => a.equals(approverPubkey))) {
        toast.error("Address is already an approver");
        return;
      }

      // Check max limit
      if (selectedVault.approvers.length >= 10) {
        toast.error("Maximum approver limit (10) reached");
        return;
      }

      // Call add_approver instruction
      const vaultPubkey = new PublicKey(selectedVaultAddress);
      await program.methods
        .addApprover(approverPubkey)
        .accounts({
          vault: vaultPubkey,
          owner: publicKey,
        })
        .rpc();

      toast.success("Approver added successfully!");
      setApproverInput("");

      // Trigger vault data refetch immediately
      console.log("🔄 Triggering global refetch after add approver...");
      refetchVaults();
    } catch (err) {
      console.error("Error adding approver:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add approver");
    } finally {
      setLoading(false);
    }
  };

  // Remove staff member
  const handleRemoveStaff = async (staffPubkey: PublicKey) => {
    if (!program || !publicKey || !selectedVaultAddress) return;

    try {
      setLoading(true);

      const vaultPubkey = new PublicKey(selectedVaultAddress);
      const signature = await program.methods
        .removeStaff(staffPubkey)
        .accounts({
          vault: vaultPubkey,
          owner: publicKey,
        })
        .rpc();

      console.log("✅ Staff removed, tx:", signature);

      toast.success("Staff member removed successfully!");
      
      // Trigger global refetch immediately
      console.log("🔄 Triggering global refetch after remove staff...");
      refetchVaults();
    } catch (err) {
      console.error("Error removing staff:", err);
      toast.error(err instanceof Error ? err.message : "Failed to remove staff member");
    } finally {
      setLoading(false);
    }
  };

  // Remove approver
  const handleRemoveApprover = async (approverPubkey: PublicKey) => {
    if (!program || !publicKey || !selectedVault || !selectedVaultAddress) return;

    try {
      setLoading(true);

      // Check if removing would break approval threshold
      if (selectedVault.approvers.length <= selectedVault.approvalThreshold) {
        toast.error(`Cannot remove approver: would break approval threshold (${selectedVault.approvalThreshold})`);
        return;
      }

      const vaultPubkey = new PublicKey(selectedVaultAddress);
      const signature = await program.methods
        .removeApprover(approverPubkey)
        .accounts({
          vault: vaultPubkey,
          owner: publicKey,
        })
        .rpc();

      console.log("✅ Approver removed, tx:", signature);

      toast.success("Approver removed successfully!");
      
      // Trigger global refetch immediately
      console.log("🔄 Triggering global refetch after remove approver...");
      refetchVaults();
    } catch (err) {
      console.error("Error removing approver:", err);
      toast.error(err instanceof Error ? err.message : "Failed to remove approver");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: PublicKey) => {
    const str = address.toString();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  if (vaultsLoading || !selectedVault) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6" />
            Manage Team
          </DialogTitle>
          <DialogDescription>
            Add or remove staff members and approvers for this vault
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Staff Members</h3>
              <span className="text-sm text-muted-foreground">
                {selectedVault.staff.length}/20
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              People who can request withdrawals
            </p>

            {/* Staff List */}
            <div className="space-y-2">
              {selectedVault.staff.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No staff members yet
                </div>
              ) : (
                selectedVault.staff.map((staff) => (
                  <div
                    key={staff.toString()}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-white/5"
                  >
                    <span className="font-mono text-sm">{formatAddress(staff)}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveStaff(staff)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add Staff */}
            <div className="flex gap-2">
              <Input
                placeholder="Wallet address (e.g., 5Gv8...)"
                value={staffInput}
                onChange={(e) => setStaffInput(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleAddStaff}
                disabled={loading || !staffInput}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Add
              </Button>
            </div>
          </div>

          {/* Approvers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Approvers</h3>
              <span className="text-sm text-muted-foreground">
                {selectedVault.approvers.length}/10
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              People who can approve withdrawal requests (threshold: {selectedVault.approvalThreshold})
            </p>

            {/* Approvers List */}
            <div className="space-y-2">
              {selectedVault.approvers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No approvers yet
                </div>
              ) : (
                selectedVault.approvers.map((approver) => (
                  <div
                    key={approver.toString()}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-white/5"
                  >
                    <span className="font-mono text-sm">{formatAddress(approver)}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveApprover(approver)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add Approver */}
            <div className="flex gap-2">
              <Input
                placeholder="Wallet address (e.g., 5Gv8...)"
                value={approverInput}
                onChange={(e) => setApproverInput(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleAddApprover}
                disabled={loading || !approverInput}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
