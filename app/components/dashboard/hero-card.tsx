"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVault, useUserRole } from "../../src/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface HeroCardProps {
  vaultAddress: string | null;
  hasVaults: boolean;
  onCreateVault: () => void;
}

export function HeroCard({ vaultAddress, hasVaults, onCreateVault }: HeroCardProps) {
  const { publicKey } = useWallet();
  const { vault, balance, loading, error } = useVault(vaultAddress || undefined);
  const { roles } = useUserRole(vaultAddress || undefined);

  // Format balance for display
  const formattedBalance = balance > 0 
    ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : "$0.00";

  // Role badge colors
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Staff":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Approver":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  // Show create vault button if user has no vaults
  if (publicKey && !hasVaults && !loading) {
    return (
      <Card className="relative overflow-hidden border-border/50 bg-white/5 backdrop-blur-xl p-10 group">
        <div className="relative z-10 text-center">
          <div className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Get Started
          </div>
          <div className="text-4xl font-light font-display text-primary mb-6">
            Create Your First Vault
          </div>
          <div className="text-muted-foreground mb-8 max-w-md mx-auto">
            Set up a secure, multi-signature treasury for your organization with customizable approval workflows.
          </div>
          <Button 
            onClick={onCreateVault}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Vault
          </Button>
        </div>
        
        {/* Decorative Gradient Background */}
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: 'translate(50%, -50%)' }}
        />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-white/5 backdrop-blur-xl p-10 group">
      <div className="relative z-10">
        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
          Total Vault Value
        </div>
        <div className="text-6xl font-light font-display text-primary">
          {loading ? (
            <span className="animate-pulse">Loading...</span>
          ) : error ? (
            <span className="text-red-400 text-2xl">Error loading vault</span>
          ) : vaultAddress && vault ? (
            formattedBalance
          ) : (
            <span className="text-4xl text-muted-foreground">
              Select a vault
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="text-muted-foreground font-mono text-sm">
            {vault ? vault.name : "No vault selected"}
          </div>
          {/* Role badges */}
          {vault && roles.filter(r => r !== "Public").length > 0 && (
            <div className="flex gap-1">
              {roles.filter(r => r !== "Public").map((role) => (
                <Badge key={role} className={getRoleBadgeColor(role)}>
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {!publicKey && (
          <div className="text-xs text-muted-foreground mt-2">
            Please connect your wallet to view vault data
          </div>
        )}
      </div>
      
      {/* Decorative Gradient Background */}
      <motion.div 
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"
        initial={{ opacity: 0.5, scale: 0.8 }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: 'translate(50%, -50%)' }}
      />
    </Card>
  );
}

