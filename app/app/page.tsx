import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultDial } from "@/components/landing/vault-dial";
import { SigningCeremony } from "@/components/landing/signing-ceremony";
import { Reveal } from "@/components/landing/reveal";

const INSTRUCTIONS = [
  "create_vault",
  "add_approver",
  "add_staff",
  "update_approval_threshold",
  "request_withdrawal",
  "approve_withdrawal",
  "execute_withdrawal",
  "freeze_vault",
  "unfreeze_vault",
  "remove_approver",
  "remove_staff",
];

const ROLES = [
  {
    level: "L3",
    title: "Owner",
    seats: "1 seat",
    perks: [
      "Creates the vault and sets its limits",
      "Adds and removes approvers and staff",
      "Tunes the approval threshold",
      "Freezes everything in one transaction",
    ],
  },
  {
    level: "L2",
    title: "Approver",
    seats: "Up to 10",
    perks: [
      "Signs pending withdrawal requests",
      "One signature per request, no repeats",
      "Can never approve their own request",
      "Blocked the moment the vault freezes",
    ],
  },
  {
    level: "L1",
    title: "Staff",
    seats: "Up to 20",
    perks: [
      "Opens withdrawal requests with a reason",
      "Bounded by the per-transaction limit",
      "Triggers the time lock on large amounts",
      "Never signs, only asks",
    ],
  },
];

const SPECS = [
  { value: "M/N", label: "Approval threshold", note: "Any quorum from 1 to N approvers" },
  { value: "10", label: "Approvers", note: "Hard cap enforced on-chain" },
  { value: "20", label: "Staff seats", note: "Who may request funds" },
  { value: "Δt", label: "Time lock", note: "Delay in hours on large withdrawals" },
  { value: "≤", label: "Per-tx limit", note: "Oversized requests never open" },
  { value: "❄", label: "Freeze", note: "Halts requests, approvals, execution" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <div className="landing-noise pointer-events-none fixed inset-0 z-50" />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-xl font-light tracking-tight text-primary">
              SME Vault
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#ceremony" className="transition-colors hover:text-primary">
              Ceremony
            </a>
            <a href="#roles" className="transition-colors hover:text-primary">
              Roles
            </a>
            <a href="#guardrails" className="transition-colors hover:text-primary">
              Guardrails
            </a>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Launch App</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="landing-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <Reveal>
            <p className="mb-8 inline-flex items-center gap-3 rounded-full border border-border px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-sky-300" />
              NON-CUSTODIAL TREASURY · SOLANA
            </p>
            <h1 className="font-display text-5xl leading-[0.95] font-extralight tracking-tight text-primary sm:text-7xl lg:text-[5.5rem]">
              No one holds
              <br />
              the keys.
              <br />
              <span className="bg-gradient-to-r from-sky-200 via-primary to-primary/40 bg-clip-text text-transparent">
                Everyone holds
                <br />a key.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A multi-signature vault for small teams. Staff request, approvers sign, big
              withdrawals wait out a time lock, and the owner can freeze it all in one
              transaction.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link href="/dashboard">
                  Open a vault <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-base">
                <a href="#ceremony">
                  Try to break it <ArrowDown />
                </a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="flex justify-center lg:justify-end">
            <VaultDial />
          </Reveal>
        </div>
      </section>

      {/* Instruction marquee */}
      <div className="relative overflow-hidden border-y border-border/60 bg-secondary/20 py-4">
        <div className="landing-marquee flex w-max gap-10 font-mono text-xs tracking-wider text-muted-foreground">
          {[...INSTRUCTIONS, ...INSTRUCTIONS].map((ix, i) => (
            <span key={i} className="flex items-center gap-10">
              <span>
                <span className="text-sky-300/70">sme_vault::</span>
                {ix}
              </span>
              <span className="text-border">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Ceremony */}
      <section id="ceremony" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-28">
        <Reveal className="mb-14 grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-4 font-mono text-xs tracking-[0.2em] text-sky-300/80">
              01 / THE CEREMONY
            </p>
            <h2 className="font-display text-4xl leading-tight font-extralight tracking-tight text-primary sm:text-6xl">
              Try to rob your
              <br />
              own treasury.
            </h2>
          </div>
          <p className="max-w-lg text-muted-foreground lg:justify-self-end">
            This is the vault&apos;s approval logic, running in your browser. Pick an
            amount, collect signatures, hit execute too early, or freeze it halfway.
            Every rejection in the log is a real error the program returns.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <SigningCeremony />
        </Reveal>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-20 border-t border-border/60 bg-secondary/10">
        <div className="mx-auto max-w-7xl px-6 py-28">
          <Reveal className="mb-16">
            <p className="mb-4 font-mono text-xs tracking-[0.2em] text-sky-300/80">
              02 / CLEARANCE LEVELS
            </p>
            <h2 className="font-display text-4xl leading-tight font-extralight tracking-tight text-primary sm:text-6xl">
              Three keycards.
              <br />
              <span className="text-muted-foreground">No master key.</span>
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {ROLES.map((role, i) => (
              <Reveal key={role.title} delay={i * 0.1}>
                <Keycard {...role} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Guardrails */}
      <section id="guardrails" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-28">
        <Reveal className="mb-16 grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-4 font-mono text-xs tracking-[0.2em] text-sky-300/80">
              03 / GUARDRAILS
            </p>
            <h2 className="font-display text-4xl leading-tight font-extralight tracking-tight text-primary sm:text-6xl">
              Stamped into
              <br />
              the program.
            </h2>
          </div>
          <p className="max-w-lg text-muted-foreground lg:justify-self-end">
            These rules don&apos;t live in a policy doc or someone&apos;s good intentions.
            They are checks inside the Solana program, and a transaction that breaks one
            simply fails.
          </p>
        </Reveal>
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {SPECS.map((spec) => (
              <div
                key={spec.label}
                className="landing-plate group relative p-8"
              >
                <Screw className="top-3 left-3" />
                <Screw className="top-3 right-3" />
                <p className="font-display text-6xl font-extralight text-primary transition-colors group-hover:text-sky-200">
                  {spec.value}
                </p>
                <p className="mt-6 font-mono text-xs tracking-[0.15em] text-primary uppercase">
                  {spec.label}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{spec.note}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border/60">
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl" />
        <Reveal className="relative mx-auto max-w-4xl px-6 py-36 text-center">
          <h2 className="font-display text-5xl leading-[0.95] font-extralight tracking-tight text-primary sm:text-7xl">
            Put your treasury
            <br />
            under quorum.
          </h2>
          <p className="mx-auto mt-8 max-w-md text-muted-foreground">
            Connect a wallet, name your vault, invite your approvers. It takes a few
            minutes and a few signatures.
          </p>
          <Button asChild size="lg" className="mt-10 h-14 px-10 text-base">
            <Link href="/dashboard">
              Launch App <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-3">
            <LogoMark small />
            <span>© 2026 SME Vault</span>
          </div>
          <span className="font-mono text-xs tracking-wider">BUILT ON SOLANA · ANCHOR</span>
        </div>
      </footer>
    </div>
  );
}

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={small ? "size-5" : "size-7"}
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" className="text-primary/40" />
      <circle cx="16" cy="16" r="8" className="text-primary" />
      <circle cx="16" cy="16" r="2" className="fill-sky-300 text-sky-300" />
      <path d="M16 2v4M16 26v4M2 16h4M26 16h4" className="text-primary/60" />
    </svg>
  );
}

function Keycard({
  level,
  title,
  seats,
  perks,
}: {
  level: string;
  title: string;
  seats: string;
  perks: string[];
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/60 via-background to-background p-7 transition-all duration-500 hover:-translate-y-2 hover:-rotate-1 hover:border-sky-300/40 hover:shadow-[0_30px_60px_-30px_rgba(125,211,252,0.35)]">
      {/* Holographic sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-sky-200/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

      <div className="flex items-start justify-between">
        {/* Chip */}
        <div className="grid h-9 w-12 grid-cols-3 gap-px overflow-hidden rounded-md border border-primary/30 bg-primary/10 p-1">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="rounded-[2px] bg-primary/20" />
          ))}
        </div>
        <span className="font-mono text-4xl font-extralight text-primary/20 transition-colors group-hover:text-sky-200/60">
          {level}
        </span>
      </div>

      <p className="mt-8 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
        CLEARANCE · {seats.toUpperCase()}
      </p>
      <h3 className="mt-2 font-display text-3xl font-light text-primary">{title}</h3>

      <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
        {perks.map((perk) => (
          <li key={perk} className="flex gap-3">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-sky-300/70" />
            {perk}
          </li>
        ))}
      </ul>

      {/* Mag stripe */}
      <div className="mt-8 h-2 rounded-full bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5" />
    </div>
  );
}

function Screw({ className }: { className: string }) {
  return (
    <span
      className={`absolute size-2 rounded-full border border-primary/20 bg-primary/5 ${className}`}
      aria-hidden
    />
  );
}
