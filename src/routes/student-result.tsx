import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Printer, Loader2 } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { Panel } from "@/components/portal/ui";
import { useStudents, useSectionResults, useSubjects } from "@/hooks/useApi";
import { SEMESTERS } from "@/lib/portal-data";

type ResultSearch = { section?: string | undefined };

export const Route = createFileRoute("/student-result")({
  validateSearch: (search: Record<string, unknown>): ResultSearch => ({
    section: typeof search["section"] === "string" ? search["section"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Class Result | AIML SGPA Portal" },
      {
        name: "description",
        content: "Digital class result sheet: subject grades, SGPA for the semester for an entire class.",
      },
    ],
  }),
  component: ClassResult,
});

function ClassResult() {
  const search = Route.useSearch();
  const [selectedSection, setSelectedSection] = useState(search.section || "A");
  const [semester, setSemester] = useState(SEMESTERS[0]);

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents();
  const { data: sectionResultsData, isLoading: isResultsLoading } = useSectionResults(selectedSection);
  const { data: subjectsData, isLoading: isSubjectsLoading } = useSubjects();

  const isLoading = isStudentsLoading || isResultsLoading || isSubjectsLoading;

  const sections = useMemo(() => {
    if (!studentsData) return ["A", "B", "C", "D"]; // Fallback
    const uniqueSections = new Set(studentsData.map((s: any) => s.section).filter(Boolean));
    return Array.from(uniqueSections).sort() as string[];
  }, [studentsData]);

  // Use useEffect to set default section if empty initially, but since we default to "A" it's ok.
  // Wait, if "A" doesn't exist, we might want to default to the first available section.

  const subjects = useMemo(() => {
    return (subjectsData || []).filter((s: any) => s.semester === semester);
  }, [subjectsData, semester]);

  const results = useMemo(() => {
    return (sectionResultsData || []).filter((r: any) => r.semester === semester);
  }, [sectionResultsData, semester]);

  // Compute stats
  const stats = useMemo(() => {
    const totalStudents = results.length;
    const allClearCount = results.filter((r) => (r.arrears?.length || 0) === 0).length;

    const subjectStats = subjects.map((sub) => {
      // Assuming missing grade means not present if the student has other grades, but usually they are all present.
      // Let's check if the grade is "U" or something else.
      const present = results.filter((r) => r.grades?.[sub.code] !== undefined).length;
      const failed = results.filter((r) => r.grades?.[sub.code] === "U").length;
      const passed = present - failed;
      const passPct = present > 0 ? (passed / present) * 100 : 0;
      const failPct = present > 0 ? (failed / present) * 100 : 0;

      return {
        code: sub.code,
        present,
        absent: totalStudents - present,
        passed,
        failed,
        passPct: passPct.toFixed(0),
        failPct: failPct.toFixed(0),
      };
    });

    return { totalStudents, allClearCount, subjectStats };
  }, [results, subjects]);

  return (
    <AppShell>
      <PageHeading title="Class Result" subtitle={`Semester ${semester} - Section ${selectedSection}`} />

      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          aria-label="Section"
          className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm"
        >
          {sections.map((sec) => (
            <option key={sec} value={sec}>
              Section {sec}
            </option>
          ))}
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          aria-label="Semester"
          className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm"
        >
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
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

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-muted-foreground">No result data found for this class and semester.</div>
      ) : (
        <Panel className="overflow-x-auto p-4 sm:p-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
          <div className="min-w-max border border-border/70 rounded-md print:border-black">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-panel/95 print:bg-white print:text-black">
                <tr>
                  <th rowSpan={3} className="border border-border/50 print:border-black px-2 py-1 align-middle whitespace-nowrap">
                    S. No
                  </th>
                  <th rowSpan={3} className="border border-border/50 print:border-black px-2 py-1 align-middle whitespace-nowrap">
                    Reg.No
                  </th>
                  <th rowSpan={3} className="border border-border/50 print:border-black px-4 py-1 align-middle text-left whitespace-nowrap min-w-[200px]">
                    Name of the Student
                  </th>
                  {subjects.map((sub) => (
                    <th key={sub.code} className="border border-border/50 print:border-black px-2 py-1 whitespace-nowrap font-bold">
                      {sub.code}
                    </th>
                  ))}
                  <th rowSpan={3} className="border border-border/50 print:border-black px-2 py-1 align-middle">
                    <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }} className="m-auto h-24 flex items-center justify-center leading-tight">
                      List of<br/>Arrears
                    </div>
                  </th>
                  <th rowSpan={3} className="border border-border/50 print:border-black px-2 py-1 align-middle font-bold">
                    <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }} className="m-auto h-24 flex items-center justify-center">GPA</div>
                  </th>
                  <th rowSpan={3} className="border border-border/50 print:border-black px-2 py-1 align-middle font-bold">
                    <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }} className="m-auto h-24 flex items-center justify-center">Rank</div>
                  </th>
                </tr>
                <tr>
                  {subjects.map((sub) => (
                    <th key={`${sub.code}-credits`} className="border border-border/50 print:border-black px-2 py-1 text-[14px]">
                      {sub.credits}
                    </th>
                  ))}
                </tr>
                <tr>
                  {subjects.map((sub) => (
                    <th key={`${sub.code}-abbr`} className="border border-border/50 print:border-black px-2 py-1 font-bold text-[14px]">
                      {sub.abbr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => {
                  return (
                    <tr key={result.id} className="odd:bg-secondary/10 even:bg-secondary/30 print:bg-white">
                      <td className="border border-border/50 print:border-black px-2 py-1">{idx + 1}</td>
                      <td className="border border-border/50 print:border-black px-2 py-1">{result.register_no}</td>
                      <td className="border border-border/50 print:border-black px-4 py-1 text-left whitespace-nowrap">{result.student_name}</td>
                      {subjects.map((sub) => {
                        const grade = result.grades?.[sub.code];
                        const isFail = grade === "U";
                        return (
                          <td 
                            key={`${result.id}-${sub.code}`} 
                            className={`border border-border/50 print:border-black px-2 py-1 ${isFail ? 'bg-red-500/20 text-red-500 font-bold print:bg-red-500 print:text-white' : ''}`}
                          >
                            {grade || "-"}
                          </td>
                        );
                      })}
                      <td className="border border-border/50 print:border-black px-2 py-1">{result.arrears?.length || 0}</td>
                      <td className="border border-border/50 print:border-black px-2 py-1 font-bold text-cyan print:text-black">
                        {result.sgpa.toFixed(2)}
                      </td>
                      <td className="border border-border/50 print:border-black px-2 py-1 font-bold text-violet print:text-black">
                        {result.rank && result.rank <= 3 ? ["I", "II", "III"][result.rank - 1] : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="font-bold text-left bg-panel/95 print:bg-white print:text-black">
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Total Number of Students
                  </td>
                  {subjects.map((sub) => (
                    <td key={`total-${sub.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center">
                      {stats.totalStudents}
                    </td>
                  ))}
                  <td colSpan={3} rowSpan={8} className="border border-border/50 print:border-black px-4 py-2 align-top text-xs text-muted-foreground print:text-black whitespace-nowrap">
                    <div className="font-bold text-foreground print:text-black mb-1">SEMESTER {semester}</div>
                    {subjects.map((sub) => (
                      <div key={`legend-${sub.code}`}>
                        <span className="font-bold">{sub.code}</span> {sub.name}
                      </div>
                    ))}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Number of Students Present
                  </td>
                  {stats.subjectStats.map((stat) => (
                    <td key={`present-${stat.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center">
                      {stat.present}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Number of Students Absent
                  </td>
                  {stats.subjectStats.map((stat) => (
                    <td key={`absent-${stat.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center">
                      {stat.absent}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Number of Students Passed
                  </td>
                  {stats.subjectStats.map((stat) => (
                    <td key={`passed-${stat.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center">
                      {stat.passed}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Number of Students Failed
                  </td>
                  {stats.subjectStats.map((stat) => (
                    <td key={`failed-${stat.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center text-red-500">
                      {stat.failed > 0 ? stat.failed : 0}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Pass Percentage
                  </td>
                  {stats.subjectStats.map((stat) => (
                    <td key={`passpct-${stat.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center">
                      {stat.passPct}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Fail Percentage
                  </td>
                  {stats.subjectStats.map((stat) => (
                    <td key={`failpct-${stat.code}`} className="border border-border/50 print:border-black px-2 py-2 text-center text-red-500">
                      {stat.failPct > 0 ? stat.failPct : 0}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={3} className="border border-border/50 print:border-black px-4 py-2">
                    Number of Students All Clear
                  </td>
                  <td colSpan={subjects.length} className="border border-border/50 print:border-black px-2 py-2 text-center text-lg">
                    {stats.allClearCount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      )}
    </AppShell>
  );
}

