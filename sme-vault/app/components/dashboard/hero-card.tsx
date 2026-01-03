"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function HeroCard() {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-white/5 backdrop-blur-xl p-10 group">
      <div className="relative z-10">
        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Total Vault Value</div>
        <div className="text-6xl font-light font-display text-primary">$128,873.98</div>
        <div className="text-muted-foreground mt-4 font-mono text-sm">USDC Treasury</div>
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
