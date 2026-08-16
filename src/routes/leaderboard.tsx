import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { CountUp, Panel, PanelTitle, SectionPill } from "@/components/portal/ui";
import { SEMESTERS, SEMESTER_LABELS } from "@/lib/portal-data";
import { useLeaderboard } from "@/hooks/useApi";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Semester Leaderboard | AIML SGPA Portal" },
      {
        name: "description",
        content: "Top five SGPA scorers of the semester across AIML sections A to D, with podium ranking.",
      },
    ],
  }),
  component: Leaderboard,
});

const PODIUM = [
  { h: "h-40", glow: "from-warning/40", label: "1" },
  { h: "h-32", glow: "from-muted-foreground/40", label: "2" },
  { h: "h-24", glow: "from-pink/40", label: "3" },
];

function Leaderboard() {
  const [semester, setSemester] = useState(SEMESTERS[0] ?? "6");
  
  // We use the leaderboard hook instead of hardcoded data
  const { data: rawLeaderboard, isLoading, error } = useLeaderboard(10, semester);
  
  // Map backend StudentResultResponse to expected frontend properties
  const top = (rawLeaderboard || []).map((s: any) => ({
    id: s.id,
    name: s.student_name,
    regNo: s.register_no,
    gpa: s.sgpa,
    rank: s.rank,
    section: s.section,
  }));

  const podium = top.length >= 3 ? [top[1], top[0], top[2]] : top.length > 0 ? top : [];


  return (
    <AppShell>
      <PageHeading title="Leaderboard" subtitle="Highest SGPA scorers this semester" />

      <div className="mb-4">
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          aria-label="Semester"
          className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm"
        >
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>{SEMESTER_LABELS[s] ?? s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      ) : error ? (
        <div className="text-danger p-4">Failed to load leaderboard data</div>
      ) : (
        <>
          <Panel>
            <PanelTitle hint={semester}>Podium</PanelTitle>
            {top.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20">
                <span className="font-mono text-xl text-muted-foreground">TBD</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 items-end gap-4">
              {podium.map((s: any, i: number) => {
                const style = PODIUM[i === 1 ? 0 : i === 0 ? 1 : 2]!;
                if (!s) return <div key={i} />;
                return (
                  <div key={s.id} className="text-center">
                    <Trophy
                      className={`mx-auto mb-2 ${i === 1 ? "h-7 w-7 text-warning" : "h-5 w-5 text-muted-foreground"}`}
                    />
                    <div className={i === 1 ? "font-display text-lg font-bold" : "text-sm"}>{s.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{s.regNo}</div>
                    <div className="mt-1 font-mono text-xl font-bold text-cyan">
                      <CountUp value={s.gpa} decimals={2} />
                    </div>
                    <div
                      className={`mt-3 rounded-t-xl border border-border bg-gradient-to-t ${style.glow} to-transparent ${style.h} flex items-start justify-center pt-3 font-display text-2xl font-bold`}
                    >
                      {style.label}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </Panel>

          {top.length > 3 && (
            <Panel className="mt-4">
              <PanelTitle>Ranks 4 – {top.length}</PanelTitle>
              <ul className="space-y-2">
                {top.slice(3).map((s: any) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3"
                  >
                    <span className="grid h-8 w-8 place-content-center rounded-lg border border-border font-mono text-sm">
                      {s.rank}
                    </span>
                    <span className="text-sm">{s.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.regNo}</span>
                    <SectionPill section={s.section} />
                    <span className="ml-auto font-mono text-lg font-bold text-cyan">{s.gpa.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </AppShell>
  );
}
