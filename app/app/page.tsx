import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-light font-display text-primary">
            SME Vault
          </h1>
          <Link href="/dashboard">
            <Button variant="outline">Launch App</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-6xl font-thin font-display text-primary mb-6">
          Secure Treasury Management
          <br />
          <span className="text-primary/70">for Modern Teams</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Multi-signature vault with customizable approval workflows, 
          time-delayed withdrawals, and role-based access control on Solana.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h3 className="text-3xl font-light text-primary text-center mb-16">
          Built for Security & Transparency
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-card border border-border rounded-2xl">
            <div className="text-4xl mb-4">🔐</div>
            <h4 className="text-xl font-medium text-primary mb-3">
              Multi-Signature Approval
            </h4>
            <p className="text-muted-foreground">
              Require M-of-N approvers to authorize withdrawals. No single point of failure.
            </p>
          </div>
          
          <div className="p-8 bg-card border border-border rounded-2xl">
            <div className="text-4xl mb-4">⏱️</div>
            <h4 className="text-xl font-medium text-primary mb-3">
              Time-Delayed Withdrawals
            </h4>
            <p className="text-muted-foreground">
              Large withdrawals trigger a configurable delay period for added security.
            </p>
          </div>
          
          <div className="p-8 bg-card border border-border rounded-2xl">
            <div className="text-4xl mb-4">👥</div>
            <h4 className="text-xl font-medium text-primary mb-3">
              Role-Based Access
            </h4>
            <p className="text-muted-foreground">
              Separate permissions for owners, approvers, and staff members.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="p-12 bg-primary/5 border border-primary/20 rounded-3xl">
          <h3 className="text-4xl font-light text-primary mb-6">
            Ready to secure your treasury?
          </h3>
          <p className="text-muted-foreground mb-8">
            Connect your wallet and create your first vault in minutes.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-12">
              Launch App →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© 2026 SME Vault. Built on Solana.</p>
        </div>
      </footer>
    </div>
  );
}
