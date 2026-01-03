import type { Metadata } from "next";
import "./globals.css";
import AppWalletProvider from "@/components/providers/AppWalletProvider";

export const metadata: Metadata = {
  title: "SME-Vault | Industrial Frost",
  description: "Secure, non-custodial treasury management for SMEs on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}
