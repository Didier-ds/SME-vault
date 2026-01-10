"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton() {
  return (
    <div className="industrial-frost-wallet-btn">
      <WalletMultiButton style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "0.75rem", // rounded-xl
        color: "#CBD5E0",
        fontFamily: "var(--font-sans)",
        height: "48px",
        padding: "0 24px",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.2s ease"
      }} />
    </div>
  );
}
