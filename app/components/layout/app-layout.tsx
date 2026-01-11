"use client";

import { useRouter } from "next/navigation";
import { VaultSwitcher } from "@/components/dashboard/vault-switcher";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { useVaultContext } from "../../src/contexts/VaultContext";
import { LayoutDashboard, ArrowDownUp, Users, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { selectedVault, setSelectedVault } = useVaultContext();

  const handleCreateVault = () => {
    router.push("/dashboard/create-vault");
  };

  return (
    <SidebarProvider>
      <Sidebar>
        {/* Sidebar Header */}
        <SidebarHeader>
          <div className="px-4 py-6">
            <h1 className="text-2xl font-light tracking-wide font-display text-primary">
              SME Vault
            </h1>
          </div>
        </SidebarHeader>

        {/* Sidebar Content */}
        <SidebarContent>
          {/* Vault Switcher */}
          <VaultSwitcher 
            selectedVault={selectedVault}
            onVaultChange={setSelectedVault}
            onCreateVault={handleCreateVault}
          />

          {/* Navigation Menu */}
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ArrowDownUp className="w-4 h-4" />
                    <span>Withdrawals</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Users className="w-4 h-4" />
                    <span>Team</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer */}
        <SidebarFooter>
          <div className="px-4 py-4 text-xs text-muted-foreground">
            © 2026 SME Vault
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset>
        <div className="flex-1 p-8 lg:p-12 space-y-8 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-thin font-display text-primary">
              {/* Page title will be dynamic */}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-xs">
                Admin
              </div>
              <ConnectWalletButton />
            </div>
          </header>

          {/* Page Content */}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

