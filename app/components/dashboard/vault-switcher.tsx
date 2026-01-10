"use client";

import { useState } from "react";
import { useUserVaults } from "../../src/hooks";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface VaultSwitcherProps {
  selectedVault: string | null;
  onVaultChange: (vaultAddress: string) => void;
  onCreateVault: () => void;
}

export function VaultSwitcher({ selectedVault, onVaultChange, onCreateVault }: VaultSwitcherProps) {
  const { vaults, loading } = useUserVaults();

  // Don't render if no vaults
  if (!loading && vaults.length === 0) {
    return null;
  }

  // Find selected vault data
  const activeVault = vaults.find(v => v.address === selectedVault);
  const displayName = activeVault?.name || "Select Vault";

  if (loading) {
    return (
      <div className="px-4 py-3 mb-6">
        <div className="animate-pulse bg-primary/10 h-10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent border data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-primary">{displayName}</span>
                  {activeVault && (
                    <span className="truncate text-xs text-muted-foreground">
                      {activeVault.approverCount} approvers · {activeVault.staffCount} staff
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="right"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Your Vaults
              </DropdownMenuLabel>
              {vaults.map((vault, index) => (
                <DropdownMenuItem
                  key={vault.address}
                  onClick={() => onVaultChange(vault.address)}
                  className="gap-2 p-2"
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{vault.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {vault.approverCount} approvers · {vault.staffCount} staff
                    </span>
                  </div>
                  {vault.address === selectedVault && (
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  )}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onCreateVault}
                className="gap-2 p-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="font-medium text-muted-foreground">Create New Vault</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
