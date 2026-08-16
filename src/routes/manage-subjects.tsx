import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Loader2, Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { Panel, PanelTitle } from "@/components/portal/ui";
import { useSubjects, useCreateSubject, useDeleteSubject } from "@/hooks/useApi";
import { SEMESTERS } from "@/lib/portal-data";

export const Route = createFileRoute("/manage-subjects")({
  head: () => ({
    meta: [
      { title: "Manage Subjects | AIML SGPA Portal" },
      { name: "description", content: "Add and remove subjects for the portal." },
    ],
  }),
  component: ManageSubjects,
});

function ManageSubjects() {
  const { data: subjects, isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    abbr: "",
    credits: 3,
    faculty: "",
    semester: "6",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.abbr || !formData.faculty) {
      toast.error("Please fill in all fields");
      return;
    }
    
    createSubject.mutate(formData, {
      onSuccess: () => {
        toast.success("Subject created successfully!");
        setFormData({ ...formData, code: "", name: "", abbr: "", credits: 3 });
      },
      onError: (err: any) => {
        toast.error("Failed to create subject", { description: err.message });
      },
    });
  };

  const handleDelete = (code: string) => {
    if (confirm(`Are you sure you want to delete subject ${code}?`)) {
      deleteSubject.mutate(code, {
        onSuccess: () => toast.success(`Deleted subject ${code}`),
        onError: (err: any) => toast.error("Failed to delete subject", { description: err.message }),
      });
    }
  };

  return (
    <AppShell>
      <PageHeading title="Manage Subjects" subtitle="Add or delete subjects" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Panel>
            <PanelTitle>Add New Subject</PanelTitle>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Subject Code</label>
                <input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CS101"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Subject Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Introduction to Programming"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Abbreviation</label>
                <input
                  value={formData.abbr}
                  onChange={(e) => setFormData({ ...formData, abbr: e.target.value })}
                  placeholder="e.g. ITP"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Credits</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Faculty In-Charge</label>
                <input
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="e.g. Dr. Smith"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-cyan"
                >
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="I Semester">I Semester</option>
                  <option value="II Semester">II Semester</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createSubject.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-70"
              >
                {createSubject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Subject
              </button>
            </form>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel>
            <PanelTitle>Existing Subjects</PanelTitle>
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan" />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="bg-panel/95">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3">Code</th>
                      <th className="px-3 py-3">Subject Name</th>
                      <th className="px-3 py-3 text-center">Credits</th>
                      <th className="px-3 py-3">Semester</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subjects || []).map((sub: any) => (
                      <tr key={sub.id || sub.code} className="border-t border-border/50 hover:bg-cyan/5">
                        <td className="px-3 py-2 font-mono text-xs text-cyan">{sub.code}</td>
                        <td className="px-3 py-2">{sub.name} <span className="block text-[11px] text-muted-foreground">{sub.faculty}</span></td>
                        <td className="px-3 py-2 text-center font-mono">{sub.credits}</td>
                        <td className="px-3 py-2 text-xs">{sub.semester}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleDelete(sub.code)}
                            disabled={deleteSubject.isPending}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-danger hover:bg-danger/10 disabled:opacity-50"
                            title="Delete subject"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {subjects?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No subjects found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
