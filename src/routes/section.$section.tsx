import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Download, PenLine, Search, Loader2 } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { ArrearPill, GradeBadge, Panel } from "@/components/portal/ui";
import { SECTIONS, type Section } from "@/lib/portal-data";
import { useSectionResults, useSubjects } from "@/hooks/useApi";

export const Route = createFileRoute("/section/$section")({
  head: () => ({
    meta: [
      { title: "Section Roster & Grades | AIML SGPA Portal" },
      {
        name: "description",
        content:
          "Section-wise student roster with subject grades, arrear counts, GPA and rank for the AIML department.",
      },
    ],
  }),
  component: SectionPage,
});

function SectionPage() {
  const { section } = useParams({ from: "/section/$section" });
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const current = (SECTIONS.includes(section as Section) ? section : "A") as Section;
  
  const { data: resultsData, isLoading: isResultsLoading } = useSectionResults(current);
  const { data: subjectsData, isLoading: isSubjectsLoading } = useSubjects();

  const isLoading = isResultsLoading || isSubjectsLoading;
  const subjects = subjectsData || [];
  const rawRows = resultsData || [];

  const rows = rawRows.filter(
    (s: any) =>
      s.student_name.toLowerCase().includes(q.toLowerCase()) ||
      s.register_no.toLowerCase().includes(q.toLowerCase()),
  );

  const handleExport = () => {
    if (!rows.length) return;

    const headers = [
      "S.No",
      "Reg.No",
      "Name of Student",
      ...subjects.map((s: any) => s.code),
      "Arrears",
      "GPA",
      "Rank"
    ];

    const csvRows = rows.map((s: any, i: number) => {
      return [
        i + 1,
        s.register_no,
        `"${s.student_name}"`,
        ...subjects.map((sub: any) => s.grades?.[sub.code] || "-"),
        s.arrears?.length || 0,
        s.sgpa?.toFixed(2) || "0.00",
        s.rank || "-"
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `section_${current}_grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <PageHeading
        title={`Section ${current}`}
        subtitle="Read-only grade summary — edit values from Grade Entry"
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
            {SECTIONS.map((s) => (
              <Link
                key={s}
                to="/section/$section"
                params={{ section: s }}
                className={`rounded-lg px-4 py-1.5 font-display text-sm font-bold ${
                  s === current ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>

          <label className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or register no."
              aria-label="Search students"
              className="w-64 rounded-xl border border-border bg-secondary/60 py-2 pl-10 pr-3 text-sm outline-none focus:border-cyan"
            />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-cyan/60 hover:text-cyan"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 bg-panel/95 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">S.No</th>
                  <th className="px-3 py-3">Reg.No</th>
                  <th className="px-3 py-3">Name of Student</th>
                  {subjects.map((s: any) => (
                    <th key={s.code} className="px-3 py-2 text-center">
                      <div className="font-mono text-cyan">{s.code}</div>
                      <div className="font-normal normal-case text-[10px] text-muted-foreground">
                        {s.abbr} · {s.credits} cr · {s.faculty}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center">Arrears</th>
                  <th className="px-3 py-3 text-center">GPA</th>
                  <th className="px-3 py-3 text-center">Rank</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s: any, i: number) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate({ to: "/student-result", search: { reg: s.register_no } })}
                    className="cursor-pointer border-t border-border/50 odd:bg-secondary/20 hover:bg-cyan/5"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.register_no}</td>
                    <td className="px-3 py-2">{s.student_name}</td>
                    {subjects.map((sub: any) => (
                      <td key={sub.code} className="px-3 py-2 text-center">
                        <GradeBadge grade={s.grades?.[sub.code] || ""} />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <ArrearPill count={s.arrears.length} />
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-bold text-cyan">
                      {s.sgpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-xs">{s.rank}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        aria-label={`Edit grades for ${s.student_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({
                            to: "/grade-entry",
                            search: { section: current, reg: s.register_no },
                          });
                        }}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-cyan/60 hover:text-cyan"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No students match “{q}”.
          </p>
        ) : null}
      </Panel>
    </AppShell>
  );
}
