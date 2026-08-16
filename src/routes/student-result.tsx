import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Printer, Loader2 } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { CountUp, GradeBadge, Panel, PanelTitle, SectionPill } from "@/components/portal/ui";
import { useStudents, useStudentResults, useSubjects } from "@/hooks/useApi";
import { SEMESTERS } from "@/lib/portal-data";

type ResultSearch = { reg?: string | undefined };

export const Route = createFileRoute("/student-result")({
  validateSearch: (search: Record<string, unknown>): ResultSearch => ({
    reg: typeof search["reg"] === "string" ? search["reg"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Student Result | AIML SGPA Portal" },
      {
        name: "description",
        content:
          "Digital marksheet for an AIML student: subject grades, SGPA for the semester and cumulative CGPA.",
      },
    ],
  }),
  component: StudentResult,
});

function StudentResult() {
  const search = Route.useSearch();
  const [reg, setReg] = useState(search.reg || "");

  const { data: studentsData } = useStudents();
  const students = studentsData || [];

  // Automatically select the first student if none is selected
  useEffect(() => {
    if (!reg && students.length > 0) {
      setReg(students[0].register_no);
    }
  }, [students, reg]);

  const { data: resultsData, isLoading: isResultsLoading } = useStudentResults(reg);
  const { data: subjectsData, isLoading: isSubjectsLoading } = useSubjects();

  const isLoading = isResultsLoading || isSubjectsLoading;

  const result = (resultsData || []).find((r: any) => r.semester === SEMESTERS[0]) || (resultsData || [])[0];
  const subjects = subjectsData || [];

  // Dummy trend for UI since we only have one semester of data right now
  const cgpa = result?.cgpa || 0;
  const sgpa = result?.sgpa || 0;
  const trend = [7.8, 8.2, 8.05, cgpa, sgpa];

  return (
    <AppShell>
      <PageHeading title="Student Result" subtitle="Digital marksheet" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={reg}
          onChange={(e) => setReg(e.target.value)}
          aria-label="Student"
          className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm"
        >
          {students.map((s: any) => (
            <option key={s.id} value={s.register_no}>
              {s.name} — {s.register_no} (Sec {s.section})
            </option>
          ))}
        </select>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:border-cyan/60 hover:text-cyan"
        >
          <Printer className="h-4 w-4" /> Print / Export as PDF
        </button>
      </div>

      {isLoading && reg ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      ) : !result ? (
        <div className="p-4 text-muted-foreground">No result data found for this student.</div>
      ) : (
        <Panel>
          <div className="flex flex-wrap items-center gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="font-display text-2xl font-bold">{result.student_name}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{result.register_no}</div>
            </div>
            <SectionPill section={result.section} />
            <span className="text-xs text-muted-foreground">Semester {result.semester}</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-panel/95">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3 text-center">Credits</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub: any) => {
                    const grade = result.grades?.[sub.code];
                    if (!grade) return null;
                    return (
                      <tr key={sub.code} className="border-t border-border/50 odd:bg-secondary/20">
                        <td className="px-3 py-2">
                          {sub.name}
                          <span className="block text-[11px] text-muted-foreground">{sub.faculty}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-cyan">{sub.code}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{sub.credits}</td>
                        <td className="px-3 py-2 text-center">
                          <GradeBadge grade={grade} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-6 text-center shadow-[var(--glow-cyan)]">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">SGPA</div>
                <div className="font-display text-4xl font-bold text-cyan">
                  <CountUp value={sgpa} decimals={2} />
                </div>
              </div>
              <div className="rounded-2xl border border-violet/30 bg-violet/5 p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">CGPA</div>
                <div className="font-display text-4xl font-bold text-violet">
                  <CountUp value={cgpa} decimals={2} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <PanelTitle>Trend</PanelTitle>
                <svg viewBox="0 0 200 60" className="h-16 w-full">
                  <polyline
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth="2"
                    points={trend
                      .map((v, i) => `${(i / (trend.length - 1)) * 190 + 5},${58 - (v / 10) * 52}`)
                      .join(" ")}
                  />
                </svg>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
