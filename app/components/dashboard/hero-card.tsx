"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVault } from "../../src/hooks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface HeroCardProps {
  vaultAddress: string | null;
  hasVaults: boolean;
  onCreateVault: () => void;
}

export function HeroCard({ vaultAddress, hasVaults, onCreateVault }: HeroCardProps) {
  const { publicKey } = useWallet();
  const { vault, balance, loading, error } = useVault(vaultAddress || undefined);

  // Format balance for display
  const formattedBalance = balance > 0 
    ? `${balance.toFixed(2)} SOL` 
    : "$0.00";

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
        <div className="text-muted-foreground mt-4 font-mono text-sm">
          {vault ? vault.name : "No vault selected"}
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
