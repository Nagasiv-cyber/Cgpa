import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GradeCode } from "@/lib/portal-data";
import { gradeTone } from "@/lib/portal-data";

export function Panel({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("glass animate-rise rounded-2xl p-5", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

export function PanelTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-cyan">
        {children}
      </h2>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function GradeBadge({ grade }: { grade: GradeCode }) {
  const tone = gradeTone(grade);
  return (
    <span
      className={cn(
        "inline-flex min-w-9 items-center justify-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold",
        tone === "success" && "border-success/40 bg-success/12 text-success",
        tone === "warning" && "border-warning/40 bg-warning/12 text-warning",
        tone === "danger" && "border-danger/50 bg-danger/15 text-danger",
      )}
    >
      {grade}
    </span>
  );
}

export function ArrearPill({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs",
        count > 0
          ? "bg-danger/15 text-danger ring-1 ring-danger/40"
          : "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

export function SectionPill({ section }: { section: string }) {
  return (
    <span className="rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-xs text-foreground">
      Sec {section}
    </span>
  );
}

export function CountUp({
  value,
  decimals = 0,
  className,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  delay = 0,
  accent,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  delay?: number;
  accent?: "cyan" | "violet" | "success" | "pink";
}) {
  const ring = {
    cyan: "text-cyan",
    violet: "text-violet",
    success: "text-success",
    pink: "text-pink",
  }[accent ?? "cyan"];
  return (
    <Panel delay={delay} className="relative overflow-hidden">
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={cn("mt-3 font-display text-4xl font-bold", ring)}>
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="mt-4 h-px w-full bg-gradient-primary opacity-40" />
    </Panel>
  );
}

export function Donut({ pct, size = 148 }: { pct: number; size?: number }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="12"
          stroke="var(--muted)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          stroke="var(--success)"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-display text-2xl font-bold text-success">
          <CountUp value={pct} decimals={2} suffix="%" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">pass</div>
      </div>
    </div>
  );
}
