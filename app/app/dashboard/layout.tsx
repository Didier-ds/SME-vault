import { AppLayout } from "@/components/layout/app-layout";
import { VaultProvider } from "../../src/contexts/VaultContext";
import { PageTransition } from "@/components/ui/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VaultProvider>
      <AppLayout>
        <PageTransition>
          {children}
        </PageTransition>
      </AppLayout>
    </VaultProvider>
  );
}
