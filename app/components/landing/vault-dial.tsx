"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const APPROVERS = 5;
const THRESHOLD = 3;
const CENTER = 200;
const NODE_RADIUS = 158;

// Signing order for the idle loop, then a beat where the vault reads "unlocked".
const SEQUENCE = [1, 3, 4];
const STEPS = SEQUENCE.length + 3;

const ticks = Array.from({ length: 120 }, (_, i) => {
  const angle = (i / 120) * Math.PI * 2;
  const major = i % 10 === 0;
  const inner = major ? 116 : 122;
  return {
    x1: CENTER + Math.cos(angle) * inner,
    y1: CENTER + Math.sin(angle) * inner,
    x2: CENTER + Math.cos(angle) * 130,
    y2: CENTER + Math.sin(angle) * 130,
    major,
  };
});

const nodes = Array.from({ length: APPROVERS }, (_, i) => {
  const angle = (i / APPROVERS) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * NODE_RADIUS,
    y: CENTER + Math.sin(angle) * NODE_RADIUS,
  };
});

export function VaultDial() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setTick((s) => (s + 1) % STEPS), 1100);
    return () => clearInterval(id);
  }, [reduceMotion]);

  // With reduced motion, park the dial in its unlocked state.
  const step = reduceMotion ? STEPS - 1 : tick;

  const signed = new Set(SEQUENCE.slice(0, Math.min(step, SEQUENCE.length)));
  const unlocked = signed.size >= THRESHOLD;

  return (
    <div className="relative aspect-square w-full max-w-130">
      {/* Halo */}
      <motion.div
        className="absolute inset-[12%] rounded-full blur-3xl"
        animate={{
          opacity: unlocked ? 0.55 : 0.18,
          scale: unlocked ? 1.08 : 1,
        }}
        transition={{ duration: 0.8 }}
        style={{
          background:
            "radial-gradient(circle, rgba(125,211,252,0.5) 0%, rgba(203,213,224,0.08) 60%, transparent 70%)",
        }}
      />

      <svg viewBox="0 0 400 400" className="relative h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="dial-face" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a1d21" />
            <stop offset="100%" stopColor="#050708" />
          </radialGradient>
        </defs>

        {/* Bezel ticks */}
        <motion.g
          style={{ originX: "200px", originY: "200px" }}
          animate={reduceMotion ? undefined : { rotate: unlocked ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 40, damping: 12 }}
        >
          {ticks.map((t, i) => (
            <line
              key={i}
              {...t}
              stroke="#CBD5E0"
              strokeOpacity={t.major ? 0.7 : 0.22}
              strokeWidth={t.major ? 1.5 : 1}
            />
          ))}
        </motion.g>

        {/* Counter-rotating dashed ring */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={100}
          fill="none"
          stroke="#CBD5E0"
          strokeOpacity={0.25}
          strokeDasharray="2 6"
          style={{ originX: "200px", originY: "200px" }}
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Signature beams */}
        {nodes.map((n, i) => (
          <motion.line
            key={`beam-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={n.x}
            y2={n.y}
            stroke="#7dd3fc"
            strokeWidth={1}
            initial={false}
            animate={{
              pathLength: signed.has(i) ? 1 : 0,
              opacity: signed.has(i) ? 0.8 : 0,
            }}
            transition={{ duration: 0.5 }}
          />
        ))}

        {/* Face */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={84}
          fill="url(#dial-face)"
          stroke="#CBD5E0"
          strokeOpacity={0.15}
        />

        {/* Spokes, which spin open once quorum is reached */}
        <motion.g
          style={{ originX: "200px", originY: "200px" }}
          animate={{ rotate: unlocked ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x={CENTER + 64}
              y={CENTER - 1.5}
              width={14}
              height={3}
              rx={1.5}
              fill="#CBD5E0"
              fillOpacity={0.35}
              transform={`rotate(${deg} ${CENTER} ${CENTER})`}
            />
          ))}
        </motion.g>

        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          className="fill-[#CBD5E0] font-mono"
          fontSize={34}
          fontWeight={200}
        >
          {signed.size}/{THRESHOLD}
        </text>
        <text
          x={CENTER}
          y={CENTER + 20}
          textAnchor="middle"
          className="font-mono"
          fontSize={9}
          letterSpacing={3}
          fill={unlocked ? "#7dd3fc" : "#6b7280"}
        >
          {unlocked ? "QUORUM · RELEASED" : "AWAITING SIGNERS"}
        </text>

        {/* Approver nodes */}
        {nodes.map((n, i) => {
          const isSigned = signed.has(i);
          return (
            <g key={`node-${i}`}>
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={18}
                fill="#050708"
                initial={false}
                animate={{
                  stroke: isSigned ? "#7dd3fc" : "rgba(203,213,224,0.3)",
                }}
                strokeWidth={1.5}
              />
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={5}
                initial={false}
                animate={{
                  fill: isSigned ? "#7dd3fc" : "rgba(203,213,224,0.2)",
                  scale: isSigned ? [1, 1.8, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
