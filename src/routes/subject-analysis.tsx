import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { Donut, Panel, PanelTitle } from "@/components/portal/ui";
import { SEMESTERS, SEMESTER_LABELS } from "@/lib/portal-data";
import { useSubjectAnalysis, useLeaderboard } from "@/hooks/useApi";

export const Route = createFileRoute("/subject-analysis")({
  head: () => ({
    meta: [
      { title: "Result Analysis | AIML SGPA Portal" },
      {
        name: "description",
        content:
          "Semester and subject-wise result analysis: pass percentage, failure counts, grade distribution and arrear lists.",
      },
    ],
  }),
  component: Analysis,
});

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

const GRADES_ORDER = ["O", "A+", "A", "B+", "B", "C", "U"];

function Analysis() {
  const [tab, setTab] = useState<"semester" | "subject">("semester");
  const [semester, setSemester] = useState(SEMESTERS[0] ?? "6");
  const [subjectCode, setSubjectCode] = useState<string | null>(null);

  const { data: analysisData, isLoading: isAnalLoading } = useSubjectAnalysis(semester);
  const { data: leaderboardData, isLoading: isLdbLoading } = useLeaderboard(1000, semester);

  const isLoading = isAnalLoading || isLdbLoading;
  const codes = (analysisData || []).map((a: any) => a.subject_code);
  const currentCode = subjectCode && codes.includes(subjectCode) ? subjectCode : codes[0] || "";

  return (
    <AppShell>
      <PageHeading title="Result Analysis" subtitle="Cohort rollup and per-subject drill-down" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
          {(["semester", "subject"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm ${
                tab === t ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "semester" ? "Semester Analysis" : "Subject-wise Analysis"}
            </button>
          ))}
        </div>
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
      ) : (
        tab === "semester" ? (
          <SemesterTab analysisData={analysisData} leaderboardData={leaderboardData} />
        ) : (
          <SubjectTab 
            analysisData={analysisData} 
            code={currentCode} 
            onSelect={setSubjectCode} 
            codes={codes}
          />
        )
      )}
    </AppShell>
  );
}

function SemesterTab({ analysisData, leaderboardData }: { analysisData: any[]; leaderboardData: any[] }) {
  const all = (leaderboardData || []).filter((s: any) => s && typeof s.sgpa === "number");
  const cleared = all.filter((s: any) => Array.isArray(s.arrears) && s.arrears.length === 0);
  const appeared = all.length;
  const failed = appeared - cleared.length;
  const passPct = appeared > 0 ? (cleared.length / appeared) * 100 : 0;
  
  const stats = {
    appeared,
    cleared,
    failed,
    passPct,
  };

  const toppers = all
    .slice(0, 3)
    .map((s: any) => ({ name: s.student_name ?? s.name ?? "Unknown", gpa: +Number(s.sgpa).toFixed(2) }))
    .filter((t: any) => t.gpa > 0);
  const podiumColors = ["var(--warning)", "var(--accent-cyan)", "var(--accent-pink)"];

  const buckets = [1, 2, 3].map((n) => ({
    label: n === 3 ? "3+ arrears" : `${n} arrear${n > 1 ? "s" : ""}`,
    count: all.filter((s: any) => {
      if (!Array.isArray(s.arrears)) return false;
      return n === 3 ? s.arrears.length >= 3 : s.arrears.length === n;
    }).length,
  }));

  const perSubject = (analysisData || []).map((sub: any) => {
    const pass = typeof sub.pass_percentage === "number" ? sub.pass_percentage : 0;
    return {
      code: sub.subject_code,
      pass: +pass.toFixed(1),
      fail: +(100 - pass).toFixed(1),
    };
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <PanelTitle>Topper Spotlight</PanelTitle>
        {toppers.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No results recorded yet for this semester.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={toppers} layout="vertical" margin={{ left: 20, right: 40 }}>
              <XAxis type="number" domain={[0, 10]} stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={90} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="gpa" radius={[0, 8, 8, 0]}>
                {toppers.map((_: any, i: number) => (
                  <Cell key={i} fill={podiumColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel>
        <PanelTitle>Overall Pass / Fail</PanelTitle>
        <div className="flex flex-wrap items-center gap-8">
          <Donut pct={isFinite(stats.passPct) ? stats.passPct : 0} />
          <table className="text-sm">
            <tbody className="[&_td]:py-1.5 [&_td:first-child]:pr-8 [&_td:first-child]:text-muted-foreground">
              <tr>
                <td>Appeared</td>
                <td className="font-mono">{stats.appeared}</td>
              </tr>
              <tr>
                <td>All Pass</td>
                <td className="font-mono text-success">{stats.cleared.length}</td>
              </tr>
              <tr>
                <td>Failed</td>
                <td className="font-mono text-danger">{stats.failed}</td>
              </tr>
              <tr>
                <td>Pass %</td>
                <td className="font-mono">{isFinite(stats.passPct) ? stats.passPct.toFixed(2) : "0.00"}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Failure Count Analysis</PanelTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buckets}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="count" fill="var(--danger)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel>
        <PanelTitle>Per-subject Pass %</PanelTitle>
        {perSubject.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            No subject data available for this semester.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perSubject}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="code" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="pass" stackId="a" fill="var(--success)" />
              <Bar dataKey="fail" stackId="a" fill="var(--danger)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  );
}

function SubjectTab({ analysisData, code, onSelect, codes }: { analysisData: any[]; code: string; onSelect: (c: string) => void; codes: string[] }) {
  const subject = (analysisData || []).find((s: any) => s.subject_code === code) || (analysisData || [])[0];
  
  if (!subject) return <div className="p-4 text-muted-foreground">No subjects found for this semester.</div>;

  const distribution = GRADES_ORDER.map((g) => ({
    grade: g,
    count: subject.grade_distribution?.[g] || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {codes.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={`rounded-full border px-4 py-1.5 font-mono text-xs ${
              c === code
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Panel>
        <PanelTitle hint={subject.subject_code}>{subject.subject_code}</PanelTitle>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {[
            ["Appeared", String(subject.total_appeared)],
            ["Passed", String(subject.passed)],
            ["Failed", String(subject.failed)],
            ["Pass %", `${subject.pass_percentage.toFixed(2)}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border/70 bg-secondary/40 p-4">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
              <div className="mt-1 font-display text-base font-bold">{value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle>Grade Distribution</PanelTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={distribution}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="grade" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                dot={{ fill: "var(--accent-cyan)", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle hint={`${(subject.arrear_students || []).length} students`}>Arrears — {subject.subject_code}</PanelTitle>
          <div className="max-h-[220px] overflow-y-auto rounded-xl border border-danger/25">
            <table className="w-full text-sm">
              <thead className="bg-panel/95">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Reg.No</th>
                  <th className="px-3 py-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {(subject.arrear_students || []).map((s: string) => (
                  <tr key={s} className="border-t border-border/50">
                    <td className="px-3 py-2 font-mono text-xs">{s}</td>
                    <td className="px-3 py-2 text-center font-mono text-danger">U</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle>Subject Wise Result Analysis</PanelTitle>
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-panel/95">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3">S.No</th>
                <th className="px-3 py-3">Sub Code</th>
                <th className="px-3 py-3 text-center">Appeared</th>
                <th className="px-3 py-3 text-center">Failed</th>
                <th className="px-3 py-3 text-center">Pass %</th>
              </tr>
            </thead>
            <tbody>
              {(analysisData || []).map((sub: any, i: number) => {
                return (
                  <tr
                    key={sub.subject_code}
                    className={`border-t border-border/50 ${
                      sub.subject_code === code ? "bg-cyan/10" : "odd:bg-secondary/20"
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-cyan">{sub.subject_code}</td>
                    <td className="px-3 py-2 text-center font-mono text-xs">{sub.total_appeared}</td>
                    <td className="px-3 py-2 text-center font-mono text-xs text-danger">{sub.failed}</td>
                    <td className="px-3 py-2 text-center font-mono text-xs text-success">
                      {sub.pass_percentage.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
