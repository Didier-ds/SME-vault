"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVault } from "./useVault";
import { UserRole } from "../types/role";

export function useUserRole(vaultAddress?: string) {
  const { publicKey } = useWallet();
  const { vault, loading } = useVault(vaultAddress);

  const roleInfo = useMemo(() => {
    // No wallet connected
    if (!publicKey) {
      return {
        isOwner: false,
        isStaff: false,
        isApprover: false,
        roles: [UserRole.Public],
        loading: false,
      };
    }

    // Vault not loaded yet
    if (loading || !vault) {
      return {
        isOwner: false,
        isStaff: false,
        isApprover: false,
        roles: [],
        loading: true,
      };
    }

    // Check roles
    const isOwner = vault.owner.equals(publicKey);
    const isStaff = vault.staff.some((staffKey) => staffKey.equals(publicKey));
    const isApprover = vault.approvers.some((approverKey) => approverKey.equals(publicKey));

    // Build roles array
    const roles: UserRole[] = [];
    if (isOwner) roles.push(UserRole.Owner);
    if (isStaff) roles.push(UserRole.Staff);
    if (isApprover) roles.push(UserRole.Approver);
    if (roles.length === 0) roles.push(UserRole.Public);

    return {
      isOwner,
      isStaff,
      isApprover,
      roles,
      loading: false,
    };
  }, [publicKey, vault, loading]);

  return roleInfo;
}
