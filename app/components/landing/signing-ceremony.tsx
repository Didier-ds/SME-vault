"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { Check, Clock, KeyRound, RotateCcw, Snowflake } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Mirrors the on-chain vault config used by request/approve/execute_withdrawal.
const TX_LIMIT = 100_000;
const LARGE_WITHDRAWAL_THRESHOLD = 10_000;
const DELAY_HOURS = 24;
const SIM_MS_PER_HOUR = 900;

const APPROVERS = [
  { name: "Ama", role: "CFO" },
  { name: "Kwame", role: "COO" },
  { name: "Lena", role: "Ops" },
  { name: "Tomás", role: "Legal" },
  { name: "Yuki", role: "Board" },
];

const AMOUNTS = [1_200, 8_500, 25_000, 250_000];

type Status = "Pending" | "Approved" | "Executed";

type Request = {
  id: number;
  amount: number;
  signed: number[];
  status: Status;
  delayLeft: number | null;
};

type LogLine = { id: number; kind: "call" | "ok" | "err"; text: string };

const fmt = (n: number) => n.toLocaleString("en-US");

const INITIAL_AMOUNT = 25_000;
const INITIAL_LOG: LogLine[] = [
  { id: 0, kind: "call", text: `request_withdrawal(${fmt(INITIAL_AMOUNT)} USDC)` },
  { id: 1, kind: "ok", text: `✓ Pending · delay_until = now + ${DELAY_HOURS}h` },
];

export function SigningCeremony() {
  const [threshold, setThreshold] = useState(3);
  const [frozen, setFrozen] = useState(false);
  const [amount, setAmount] = useState(INITIAL_AMOUNT);
  const [request, setRequest] = useState<Request | null>({
    id: 1,
    amount: INITIAL_AMOUNT,
    signed: [],
    status: "Pending",
    delayLeft: DELAY_HOURS,
  });
  const [log, setLog] = useState<LogLine[]>(INITIAL_LOG);
  const lineId = useRef(INITIAL_LOG.length);
  const requestCount = useRef(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.3 });

  const push = (...lines: Omit<LogLine, "id">[]) =>
    setLog((prev) =>
      [...prev, ...lines.map((l) => ({ ...l, id: lineId.current++ }))].slice(-7)
    );

  const openRequest = (value: number, isFrozen = frozen) => {
    setAmount(value);
    push({ kind: "call", text: `request_withdrawal(${fmt(value)} USDC)` });
    if (isFrozen) {
      push({ kind: "err", text: "✗ VaultFrozen" });
      setRequest(null);
      return;
    }
    if (value > TX_LIMIT) {
      push({ kind: "err", text: `✗ ExceedsLimit · tx_limit ${fmt(TX_LIMIT)}` });
      setRequest(null);
      return;
    }
    const large = value >= LARGE_WITHDRAWAL_THRESHOLD;
    requestCount.current += 1;
    setRequest({
      id: requestCount.current,
      amount: value,
      signed: [],
      status: "Pending",
      delayLeft: large ? DELAY_HOURS : null,
    });
    push({
      kind: "ok",
      text: large
        ? `✓ Pending · delay_until = now + ${DELAY_HOURS}h`
        : "✓ Pending · no delay",
    });
  };

  // The delay clock runs from request time, frozen or not, just like Clock::get().
  // It only advances while the demo is on screen so visitors don't miss it.
  const ticking =
    inView && request !== null && request.status !== "Executed" && !!request.delayLeft;
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => {
      setRequest((r) =>
        r && r.delayLeft ? { ...r, delayLeft: r.delayLeft - 1 } : r
      );
    }, SIM_MS_PER_HOUR);
    return () => clearInterval(id);
  }, [ticking]);

  const approve = (i: number) => {
    if (!request) return;
    const who = APPROVERS[i];
    push({ kind: "call", text: `approve_withdrawal ← ${who.name}` });
    if (frozen) return push({ kind: "err", text: "✗ VaultFrozen" });
    if (request.status !== "Pending")
      return push({ kind: "err", text: `✗ InvalidStatus (${request.status})` });
    if (request.signed.includes(i))
      return push({ kind: "err", text: "✗ AlreadyApproved" });

    const signed = [...request.signed, i];
    const reached = signed.length >= threshold;
    setRequest({ ...request, signed, status: reached ? "Approved" : "Pending" });
    push({
      kind: "ok",
      text: reached
        ? `✓ ${signed.length}/${threshold} · status → Approved`
        : `✓ ${signed.length}/${threshold} signatures`,
    });
  };

  const execute = () => {
    if (!request) return;
    push({ kind: "call", text: "execute_withdrawal()" });
    if (request.status !== "Approved")
      return push({ kind: "err", text: `✗ InvalidStatus (${request.status})` });
    if (frozen) return push({ kind: "err", text: "✗ VaultFrozen" });
    if (request.delayLeft)
      return push({ kind: "err", text: `✗ DelayNotPassed · ${request.delayLeft}h left` });
    setRequest({ ...request, status: "Executed" });
    push({ kind: "ok", text: `✓ Transferred ${fmt(request.amount)} USDC` });
  };

  const toggleFreeze = () => {
    const next = !frozen;
    setFrozen(next);
    push({
      kind: "call",
      text: next ? "freeze_vault()  ← owner" : "unfreeze_vault()  ← owner",
    });
  };

  const changeThreshold = (n: number) => {
    if (n === threshold) return;
    setThreshold(n);
    push({ kind: "call", text: `update_approval_threshold(${n})` });
    openRequest(amount);
  };

  const signedCount = request?.signed.length ?? 0;
  const delayDone = request?.delayLeft === 0 || request?.delayLeft === null;

  return (
    <div ref={rootRef} className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Controls */}
      <div className="space-y-6 rounded-2xl border border-border bg-secondary/30 p-6">
        <Control label="Withdrawal amount">
          <div className="grid grid-cols-2 gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => openRequest(a)}
                className={cn(
                  "rounded-lg border px-3 py-2 font-mono text-xs transition-colors",
                  a === amount
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                )}
              >
                {fmt(a)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            ≥ {fmt(LARGE_WITHDRAWAL_THRESHOLD)} triggers a {DELAY_HOURS}h delay. Above{" "}
            {fmt(TX_LIMIT)} hits the tx limit.
          </p>
        </Control>

        <Control label={`Approval threshold · ${threshold} of ${APPROVERS.length}`}>
          <div className="flex gap-1.5">
            {APPROVERS.map((_, i) => (
              <button
                key={i}
                onClick={() => changeThreshold(i + 1)}
                aria-label={`Require ${i + 1} approvals`}
                className={cn(
                  "h-9 flex-1 rounded-md border font-mono text-xs transition-colors",
                  i < threshold
                    ? "border-sky-300/40 bg-sky-300/10 text-sky-200"
                    : "border-border text-muted-foreground hover:text-primary"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Control>

        <Control label="Owner kill switch">
          <button
            onClick={toggleFreeze}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all",
              frozen
                ? "border-sky-300/50 bg-sky-300/10 text-sky-100 shadow-[0_0_30px_-8px_rgba(125,211,252,0.6)]"
                : "border-border text-primary hover:border-primary/40"
            )}
          >
            <span className="flex items-center gap-2">
              <Snowflake className={cn("size-4", frozen && "animate-spin [animation-duration:6s]")} />
              {frozen ? "Vault frozen" : "Freeze vault"}
            </span>
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                frozen ? "bg-sky-300/60" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-background transition-all",
                  frozen ? "left-4.5" : "left-0.5"
                )}
              />
            </span>
          </button>
        </Control>
      </div>

      {/* Request + log */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
          {request ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                    REQUEST #{String(request.id).padStart(4, "0")} · STAFF → VENDOR
                  </p>
                  <p className="mt-2 font-display text-4xl font-extralight text-primary sm:text-5xl">
                    {fmt(request.amount)}
                    <span className="ml-2 text-lg text-muted-foreground">USDC</span>
                  </p>
                </div>
                <StatusPill status={request.status} />
              </div>

              {/* Quorum meter */}
              <div className="mt-8">
                <div className="mb-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>QUORUM</span>
                  <span>
                    {Math.min(signedCount, threshold)} / {threshold}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: threshold }, (_, i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 flex-1 rounded-full bg-muted"
                      animate={{
                        backgroundColor: i < signedCount ? "#7dd3fc" : "#1a1d21",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Approvers */}
              <div className="mt-6 grid grid-cols-5 gap-2">
                {APPROVERS.map((a, i) => {
                  const isSigned = request.signed.includes(i);
                  return (
                    <motion.button
                      key={a.name}
                      onClick={() => approve(i)}
                      whileTap={{ scale: 0.94 }}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-xl border px-1 py-3 transition-colors",
                        isSigned
                          ? "border-sky-300/50 bg-sky-300/5"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full border text-xs transition-colors",
                          isSigned
                            ? "border-sky-300 bg-sky-300 text-background"
                            : "border-border text-primary group-hover:border-primary/50"
                        )}
                      >
                        {isSigned ? <Check className="size-4" /> : a.name[0]}
                      </span>
                      <span className="text-[11px] text-primary">{a.name}</span>
                      <span className="hidden font-mono text-[9px] tracking-wider text-muted-foreground sm:block">
                        {a.role.toUpperCase()}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Delay + execute */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {request.delayLeft === null ? (
                    <span>Under {fmt(LARGE_WITHDRAWAL_THRESHOLD)}, so no time lock</span>
                  ) : delayDone ? (
                    <span className="text-primary">Time lock elapsed</span>
                  ) : (
                    <span>
                      Time lock{" "}
                      <span className="font-mono text-primary tabular-nums">
                        {String(request.delayLeft).padStart(2, "0")}:00:00
                      </span>
                    </span>
                  )}
                </div>
                {request.status === "Executed" ? (
                  <button
                    onClick={() => openRequest(amount)}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-primary hover:border-primary/40"
                  >
                    <RotateCcw className="size-4" /> New request
                  </button>
                ) : (
                  <button
                    onClick={execute}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all",
                      request.status === "Approved" && delayDone && !frozen
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border text-muted-foreground hover:text-primary"
                    )}
                  >
                    <KeyRound className="size-4" /> Execute
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
                NO ACTIVE REQUEST
              </p>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                The program rejected it. Check the log, adjust, and try again.
              </p>
            </div>
          )}

          {/* Frost overlay */}
          <AnimatePresence>
            {frozen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="landing-frost pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 1.6, rotate: -18, opacity: 0 }}
                  animate={{ scale: 1, rotate: -8, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                  className="rounded-md border-2 border-sky-200/70 px-5 py-2 font-mono text-lg tracking-[0.4em] text-sky-100"
                >
                  FROZEN
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Program log */}
        <div className="flex flex-col rounded-2xl border border-border bg-[#030405] p-5 font-mono text-xs">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full bg-sky-300/70 shadow-[0_0_8px_rgba(125,211,252,0.8)]" />
            program log · sme_vault
          </div>
          <div className="flex min-h-56 flex-1 flex-col justify-end gap-1.5">
            <AnimatePresence initial={false}>
              {log.map((l) => (
                <motion.div
                  key={l.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "break-words leading-relaxed",
                    l.kind === "call" && "text-primary",
                    l.kind === "ok" && "pl-3 text-sky-300/90",
                    l.kind === "err" && "pl-3 text-red-400/90"
                  )}
                >
                  {l.kind === "call" && <span className="text-muted-foreground">$ </span>}
                  {l.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[11px] tracking-wider",
        status === "Pending" && "border-border text-muted-foreground",
        status === "Approved" && "border-sky-300/50 text-sky-200",
        status === "Executed" && "border-primary bg-primary text-primary-foreground"
      )}
    >
      {status.toUpperCase()}
    </motion.span>
  );
}
