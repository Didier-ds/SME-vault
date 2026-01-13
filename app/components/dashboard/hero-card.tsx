"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserRole } from "../../src/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Check, Users, Shield, TrendingUp } from "lucide-react";
import { VaultData } from "../../src/hooks/useVault";
import { useState } from "react";

interface HeroCardProps {
  vaultAddress: string | null;
  hasVaults: boolean;
  onCreateVault: () => void;
  // New props passed from parent
  vault: VaultData | null;
  balance: number;
  tokenAccountAddress: string | null;
  loading: boolean;
  error: string | null;
}

export function HeroCard({ 
  vaultAddress, 
  hasVaults, 
  onCreateVault,
  vault,
  balance,
  tokenAccountAddress,
  loading,
  error
}: HeroCardProps) {
  const { publicKey } = useWallet();
  // Removed internal useVault hook to avoid duplicate state
  const { roles } = useUserRole();
  const [copied, setCopied] = useState(false);

  // Format balance for display
  const formattedBalance = balance > 0 
    ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  // Copy token account address
  const copyTokenAccount = () => {
    if (tokenAccountAddress) {
      navigator.clipboard.writeText(tokenAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <Card className="relative overflow-hidden border-border/50 bg-white/5 backdrop-blur-xl p-8">
      <div className="relative z-10">
        {/* Vault Name & Roles */}
        <div className="flex items-center gap-3 mb-8">
          <div className="text-lg font-light text-primary">
            {vault ? vault.name : "No vault selected"}
          </div>
          {vault && roles.filter(r => r !== "Public").length > 0 && (
            <div className="flex gap-1">
              {roles.filter(r => r !== "Public").map((role) => (
                <Badge 
                  key={role} 
                  className={
                    role === "Owner" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                    role === "Staff" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-green-500/10 text-green-500 border-green-500/20"
                  }
                >
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Large Balance Display */}
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-2">Total Vault Value</div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-light text-primary">$</span>
            <span className="text-6xl font-light text-primary">
              {loading ? (
                <span className="animate-pulse text-4xl">Loading...</span>
              ) : error ? (
                <span className="text-red-400 text-3xl">Error</span>
              ) : (
                formattedBalance
              )}
            </span>
            <span className="text-2xl font-light text-muted-foreground">USD</span>
          </div>
          
          {/* Funding Address Badge */}
          {vault && tokenAccountAddress && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 backdrop-blur-sm">
              <code className="font-mono text-xs text-primary/90 font-medium">
                {tokenAccountAddress}
              </code>
              <button
                onClick={copyTokenAccount}
                className="hover:bg-primary/20 rounded-full p-1 transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-primary/80" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Metrics Row */}
        {vault && (
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/30">
            {/* Staff Metric */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xl font-light text-primary">{vault.staff.length} <span className="text-sm text-muted-foreground">Staff</span></div>
                <div className="text-xs text-muted-foreground/60">of 20 max</div>
              </div>
            </div>

            {/* Approvers Metric */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <div className="text-xl font-light text-primary">{vault.approvers.length} <span className="text-sm text-muted-foreground">Approvers</span></div>
                <div className="text-xs text-muted-foreground/60">of 10 max</div>
              </div>
            </div>

            {/* Required Approvals Metric */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <div className="text-xl font-light text-primary">{vault.approvalThreshold} <span className="text-sm text-muted-foreground">Required</span></div>
                <div className="text-xs text-muted-foreground/60">signatures needed</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Gradient */}
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

