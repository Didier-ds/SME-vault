import { AppLayout } from "@/components/layout/app-layout";
import { VaultProvider } from "../../src/contexts/VaultContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VaultProvider>
      <AppLayout>{children}</AppLayout>
    </VaultProvider>
  );
}
