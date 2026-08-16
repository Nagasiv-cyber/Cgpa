import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { ChevronRight, Loader2, UserPlus } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { CountUp, Panel, PanelTitle } from "@/components/portal/ui";
import { GRADES, SECTIONS, SEMESTERS, SEMESTER_LABELS, computeGpa, type GradeCode, type Section } from "@/lib/portal-data";
import { useStudents, useStudentResults, useSubjects, useSubmitGrades } from "@/hooks/useApi";
import { AddStudentModal } from "@/components/portal/AddStudentModal";

type GradeSearch = { section?: Section | undefined; reg?: string | undefined };

export const Route = createFileRoute("/grade-entry")({
  validateSearch: (search: Record<string, unknown>): GradeSearch => ({
    section: SECTIONS.includes(search["section"] as Section)
      ? (search["section"] as Section)
      : undefined,
    reg: typeof search["reg"] === "string" ? search["reg"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Grade Entry | AIML SGPA Portal" },
      {
        name: "description",
        content:
          "Fast grade entry for AIML faculty: pick section, student and semester, then update subject grades with a live SGPA preview.",
      },
    ],
  }),
  component: GradeEntry,
});

function GradeEntry() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [section, setSection] = useState<Section | "">(search.section ?? "");
  const [reg, setReg] = useState(search.reg ?? "");
  const [semester, setSemester] = useState(SEMESTERS[0] ?? "6");
  const [query, setQuery] = useState("");
  const [grades, setGrades] = useState<Record<string, GradeCode | "">>({});
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Fetch data
  const { data: studentsData } = useStudents(section || undefined);
  const { data: subjectsData } = useSubjects();
  const { data: resultsData, isLoading: isLoadingResults } = useStudentResults(reg);
  const submitGrades = useSubmitGrades();

  const roster = studentsData || [];
  const subjectsDataRaw = subjectsData || [];
  const label = SEMESTER_LABELS[semester] || "";
  const subjects = subjectsDataRaw.filter((s: any) => {
    if (!s.semester) return true;
    const dbSem = String(s.semester).trim().toLowerCase();
    const stateSem = String(semester).trim().toLowerCase();
    const labelSem = label.trim().toLowerCase();
    return dbSem === stateSem || dbSem === labelSem;
  });
  console.log("DEBUG: subjectsDataRaw length:", subjectsDataRaw.length, "semester state:", semester, "label:", label, "filtered count:", subjects.length);
  const student = roster.find((s: any) => s.register_no === reg);
  
  // Find existing results for chosen semester
  const existingResult = (resultsData || []).find((r: any) => r.semester === semester);
  const existingGrades = existingResult?.grades || {};

  const activeGrades = useMemo(() => {
    const base: Record<string, GradeCode | ""> = {};
    for (const sub of subjects) {
      base[sub.code] = existingGrades[sub.code] || "";
    }
    return { ...base, ...grades };
  }, [subjects, existingGrades, grades]);

  const sgpa = computeGpa(
    Object.fromEntries(
      Object.entries(activeGrades).filter(([, v]) => v) as [string, GradeCode][]
    ),
    subjects
  );
  const incomplete = subjects.length > 0 && subjects.some((s: any) => !activeGrades[s.code]);

  const filtered = roster.filter(
    (s: any) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.register_no.toLowerCase().includes(query.toLowerCase())
  );

  const nextStudent = () => {
    const idx = roster.findIndex((s: any) => s.register_no === reg);
    const next = roster[(idx + 1) % roster.length];
    if (next) {
      setReg(next.register_no);
      setGrades({});
      navigate({ to: "/grade-entry", search: { section: section || undefined, reg: next.register_no } });
    }
  };

  const handleSave = () => {
    if (!student) return;
    
    // Filter out empty grades
    const finalGrades: Record<string, GradeCode> = {};
    Object.entries(activeGrades).forEach(([code, grade]) => {
      if (grade) finalGrades[code] = grade as GradeCode;
    });
    
    submitGrades.mutate(
      {
        register_no: student.register_no,
        student_name: student.name,
        section: student.section || section || "A",
        semester: semester,
        grades: finalGrades,
      },
      {
        onSuccess: () => {
          toast.success("Grades saved successfully", { description: student.name });
        },
        onError: (error: any) => {
          toast.error("Failed to save grades", { description: error.message });
        }
      }
    );
  };

  return (
    <AppShell>
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          defaultSection={section}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeading title="Grade Entry" subtitle="Find a student, update grades, save." />
        <button
          id="open-add-student-modal"
          onClick={() => setShowAddStudent(true)}
          className="mb-6 flex shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-[0_0_18px_color-mix(in_oklab,var(--accent-cyan)_25%,transparent)] transition-transform hover:scale-[1.03]"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>


      <Panel className="sticky top-20 z-20 mb-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
              1 · Section
            </span>
            <div className="flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSection(s);
                    setReg("");
                    setGrades({});
                  }}
                  className={`flex-1 rounded-lg py-1.5 font-display text-sm font-bold ${
                    s === section
                      ? "bg-gradient-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
              2 · Student
            </span>
            <input
              disabled={!section}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={section ? "Search name or reg. no." : "Choose a section first"}
              aria-label="Search student"
              className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {section
                ? `${filtered.length} student${filtered.length === 1 ? "" : "s"} in Section ${section}`
                : "—"}
            </p>
          </div>


          <div>
            <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
              3 · Semester
            </span>
            <div className="flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`flex-1 rounded-lg py-1.5 font-display text-sm font-bold ${
                    s === semester
                      ? "bg-gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  {SEMESTER_LABELS[s] ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {section ? (
        <Panel className="mb-4">
          <PanelTitle>Section {section} Roster</PanelTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s: any) => {
              const active = s.register_no === reg;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setReg(s.register_no);
                    setGrades({});
                    navigate({
                      to: "/grade-entry",
                      search: { section: section || undefined, reg: s.register_no },
                    });
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "border-cyan/60 bg-cyan/10 text-cyan"
                      : "border-border bg-secondary/40 text-foreground hover:border-cyan/40 hover:bg-cyan/5"
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {s.register_no}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                No students match “{query}”.
              </p>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {student ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Panel>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyan/25 bg-cyan/5 px-4 py-2 text-sm">
              <span className="text-muted-foreground">Section {student.section || section}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{student.name}</span>
              <span className="font-mono text-xs text-muted-foreground">({student.register_no})</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-panel/95">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3 text-center">Credits</th>
                    <th className="px-3 py-3">Faculty In-Charge</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub: any) => (
                    <tr key={sub.code} className="border-t border-border/50 hover:bg-cyan/5">
                      <td className="px-3 py-2">{sub.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-cyan">{sub.code}</td>
                      <td className="px-3 py-2 text-center font-mono text-xs">{sub.credits}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{sub.faculty}</td>
                      <td className="px-3 py-2 text-center">
                        <select
                          aria-label={`Grade for ${sub.name}`}
                          value={activeGrades[sub.code] ?? ""}
                          onChange={(e) =>
                            setGrades((g) => ({ ...g, [sub.code]: e.target.value as GradeCode }))
                          }
                          className={`rounded-lg border bg-secondary/60 px-3 py-1.5 font-mono text-sm ${
                            activeGrades[sub.code] ? "border-border" : "border-danger/60"
                          }`}
                        >
                          <option value="">—</option>
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {incomplete ? (
              <p className="mt-3 text-sm text-danger">Some subjects have no grade selected.</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={submitGrades.isPending}
                className="flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground disabled:opacity-70"
              >
                {submitGrades.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Grades
              </button>
              <button
                onClick={() => setGrades({})}
                className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground hover:border-cyan/60 hover:text-cyan"
              >
                Discard changes
              </button>
              <button
                onClick={nextStudent}
                className="ml-auto rounded-xl border border-violet/40 px-5 py-2.5 text-sm text-violet"
              >
                Next student in Section {student.section || section} →
              </button>
            </div>
          </Panel>

          <Panel className="h-fit lg:sticky lg:top-56">
            <PanelTitle>SGPA Preview</PanelTitle>
            {isLoadingResults ? (
               <div className="flex justify-center p-6 text-muted-foreground">
                 <Loader2 className="h-6 w-6 animate-spin" />
               </div>
            ) : (
              <div className="text-center">
                <div className="font-display text-6xl font-bold text-cyan drop-shadow-[0_0_18px_color-mix(in_oklab,var(--accent-cyan)_45%,transparent)]">
                  <CountUp value={sgpa} decimals={2} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recalculated live from credit-weighted grade points.
                </p>
              </div>
            )}
          </Panel>
        </div>
      ) : (
        <Panel>
          <p className="py-14 text-center text-sm text-muted-foreground">
            Select a section and a student to begin editing grades.
          </p>
        </Panel>
      )}
    </AppShell>
  );
}
