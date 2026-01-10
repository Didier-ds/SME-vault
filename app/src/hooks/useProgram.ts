"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/sme_vault.json";
import type { SmeVault } from "../types/sme_vault";

// Program ID from Anchor.toml
const PROGRAM_ID = new PublicKey("A5nASa3jpqhhpSLmqWayd4GnW8RRe38LCncz5GZmT4Mi");

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    
    return new AnchorProvider(
      connection,
      wallet,
      { commitment: "confirmed" }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    
    return new Program<SmeVault>(
      idl as SmeVault,
      provider
    );
  }, [provider]);

  return {
    program,
    provider,
    programId: PROGRAM_ID,
    connected: !!wallet,
  };
}
