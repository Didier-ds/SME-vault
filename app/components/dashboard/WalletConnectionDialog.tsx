"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WalletConnectionDialog() {
  const { publicKey } = useWallet();
  const isOpen = !publicKey; // Open when no wallet is connected

  // Allow pointer events for wallet adapter elements even when body has pointer-events: none
  useEffect(() => {
    if (!isOpen) {
      // Remove style when dialog closes
      const style = document.getElementById('wallet-dialog-pointer-events-fix');
      if (style) {
        style.remove();
      }
      return;
    }

    // Add CSS to allow pointer events on wallet adapter elements
    const style = document.createElement('style');
    style.id = 'wallet-dialog-pointer-events-fix';
    style.textContent = `
      body[data-scroll-locked] [class*="wallet-adapter"],
      body[data-scroll-locked] [class*="WalletAdapter"],
      body[style*="pointer-events: none"] [class*="wallet-adapter"],
      body[style*="pointer-events: none"] [class*="WalletAdapter"] {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleEl = document.getElementById('wallet-dialog-pointer-events-fix');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    // Prevent closing if no wallet is connected
    // Only allow closing when wallet is connected (open becomes false naturally)
    if (!open && !publicKey) {
      // Don't allow closing without a wallet
      return;
    }
    // When wallet is connected, the dialog will close automatically via isOpen state
  };

  const handleInteractOutside = (e: Event) => {
    const target = e.target as HTMLElement;
    // Allow interactions with wallet adapter modal
    if (
      target.closest('[data-radix-portal]') ||
      target.closest('.wallet-adapter-modal') ||
      target.closest('[class*="wallet-adapter"]') ||
      target.closest('[class*="WalletAdapter"]') ||
      target.classList.contains('wallet-adapter-button') ||
      target.closest('.wallet-adapter-button')
    ) {
      // Allow the interaction - don't prevent default
      return;
    }
    // Prevent closing by clicking outside dialog content
    e.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        showCloseButton={false}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={(e) => {
          // Prevent closing with ESC key
          e.preventDefault();
        }}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-center">Wallet Connection Required</DialogTitle>
          <DialogDescription className="text-center">
            Please connect your wallet to access the dashboard. You will need a
            Solana wallet (such as Phantom or Solflare) to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="industrial-frost-wallet-btn w-full flex justify-center">
            <WalletMultiButton
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.5rem",
                color: "#CBD5E0",
                fontFamily: "var(--font-sans)",
                height: "48px",
                padding: "0 24px",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                width: "100%",
                justifyContent: "center",
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Once connected, this dialog will automatically close.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}