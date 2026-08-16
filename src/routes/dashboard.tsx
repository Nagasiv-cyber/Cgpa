import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Crown, Medal, PenLine, Trophy, Loader2, UserPlus } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { CountUp, Donut, Panel, PanelTitle, StatCard } from "@/components/portal/ui";
import { SECTIONS, sectionStudents } from "@/lib/portal-data";
import { useLeaderboard } from "@/hooks/useApi";
import { AddStudentModal } from "@/components/portal/AddStudentModal";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Department Dashboard | AIML SGPA Portal" },
      {
        name: "description",
        content:
          "Live AIML department dashboard: toppers, pass percentage, section rosters and quick links to grade entry.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: rawLeaderboard, isLoading, error } = useLeaderboard(1000); // fetch all for stats
  const [showAddStudent, setShowAddStudent] = useState(false);
  
  const all = rawLeaderboard || [];
  const cleared = all.filter((s: any) => s.arrears.length === 0);
  const appeared = all.length;
  const failed = appeared - cleared.length;
  const passPct = appeared > 0 ? (cleared.length / appeared) * 100 : 0;
  const toppers = all.slice(0, 5);

  const stats = {
    total: appeared,
    appeared: appeared,
    cleared: cleared.length,
    failed: failed,
    passPct: passPct,
    toppers: toppers
  };

  return (
    <AppShell>
      {showAddStudent && (
        <AddStudentModal onClose={() => setShowAddStudent(false)} />
      )}
      <PageHeading title="Semester Command Center" subtitle="II Semester" />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      ) : error ? (
        <div className="text-danger p-4">Failed to load dashboard data</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Students" value={stats.total} delay={0} />
            <StatCard label="Students Appeared" value={stats.appeared} delay={60} accent="violet" />
            <StatCard label="All Cleared" value={stats.cleared} delay={120} accent="success" />
            <Panel delay={180} className="flex items-center gap-5">
              <Donut pct={stats.passPct} size={128} />
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Overall Pass %
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats.failed} student{stats.failed === 1 ? "" : "s"} with arrears
                </p>
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel delay={220} className="lg:col-span-2">
              <PanelTitle hint="Current semester">Class Toppers</PanelTitle>
              <ul className="space-y-2">
                {stats.toppers.slice(0, 3).map((s: any, i: number) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3"
                  >
                    <span className="w-6 text-center font-mono text-sm text-muted-foreground">
                      {i + 1}
                    </span>
                    {i === 0 ? (
                      <Crown className="h-5 w-5 text-warning" />
                    ) : (
                      <Medal className={i === 1 ? "h-5 w-5 text-muted-foreground" : "h-5 w-5 text-pink"} />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">{s.register_no}</span>
                    <span className={i === 0 ? "font-display text-lg font-bold" : "text-sm"}>
                      {s.student_name}
                    </span>
                    <span
                      className={`ml-auto font-mono font-bold ${i === 0 ? "text-2xl text-cyan" : "text-base text-foreground"}`}
                    >
                      <CountUp value={s.sgpa} decimals={2} />
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel delay={280}>
              <PanelTitle>Quick Links</PanelTitle>
              <div className="grid gap-2">
                <button
                  id="dashboard-add-student-btn"
                  onClick={() => setShowAddStudent(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-cyan/40 bg-cyan/5 px-4 py-3 text-sm font-semibold text-cyan transition-colors hover:border-cyan/70 hover:bg-cyan/10"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </button>
                {[
                  { to: "/grade-entry", label: "Grade Entry", icon: PenLine },
                  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
                  { to: "/subject-analysis", label: "Subject Analysis", icon: BarChart3 },
                  { to: "/manage-subjects", label: "Manage Subjects", icon: PenLine },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to as any}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm transition-colors hover:border-cyan/50 hover:text-cyan"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <Panel delay={320} className="mt-4">
            <PanelTitle hint="Choose a section to view its roster">Sections</PanelTitle>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {SECTIONS.map((sec) => (
                <Link
                  key={sec}
                  to="/section/$section"
                  params={{ section: sec }}
                  className="group rounded-2xl border border-border bg-secondary/40 p-6 text-center transition-all hover:-translate-y-1 hover:border-cyan/60 hover:shadow-[var(--glow-strong)]"
                >
                  <div className="font-display text-5xl font-bold text-gradient">{sec}</div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    {/* We rely on local state or another API to fetch section lengths, keeping hardcoded length here for structure */}
                    {sectionStudents(sec).length} students
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
