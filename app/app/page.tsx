import { HeroCard } from "@/components/dashboard/hero-card";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Placeholder (Future Component) */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar/50 backdrop-blur-md hidden md:block p-8 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide font-display text-primary mb-12">SME Vault</h1>
          <nav className="space-y-6">
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Overview</div>
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Withdrawals</div>
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Team</div>
            <div className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Settings</div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 space-y-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-thin font-display text-primary">Overview</h2>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-xs">
              Admin
            </div>
            {/* Wallet Connection at Bottom of Sidebar */}
            <div className="mt-auto">
                <ConnectWalletButton />
            </div>
          </div>
          
        </header>

        {/* Hero Card Component */}
        <HeroCard />

        {/* Recent Transactions Placeholder */}
        <section className="space-y-4">
           <h3 className="text-xl font-light text-primary/80">Recent Activity</h3>
           <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md">
             <div className="text-muted-foreground text-center py-10 font-mono text-sm">No transactions found</div>
           </div>
        </section>
      </main>
    </div>
  );
}
