import { useState } from "react";
import { toast } from "sonner";
import { X, UserPlus, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateStudent } from "@/hooks/useApi";
import { SECTIONS, type Section } from "@/lib/portal-data";

interface AddStudentModalProps {
  onClose: () => void;
  defaultSection?: Section | "" | undefined;
}

export function AddStudentModal({ onClose, defaultSection = "" }: AddStudentModalProps) {
  const navigate = useNavigate();
  const createStudent = useCreateStudent();

  const [regNo, setRegNo] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState<Section | "">(defaultSection || "A");
  const [department, setDepartment] = useState("AIML");
  const [batch, setBatch] = useState("2022-2026");
  const [email, setEmail] = useState("");
  interface FormErrors {
    regNo?: string;
    name?: string;
    section?: string;
    email?: string;
  }
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validate = () => {
    const e: FormErrors = {};
    if (!regNo.trim() || regNo.trim().length < 3) e.regNo = "Register number must be at least 3 characters.";
    if (!name.trim() || name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (!section) e.section = "Please select a section.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: { register_no: string; name: string; section: string; department?: string; batch?: string; email?: string } = {
        register_no: regNo.trim().toUpperCase(),
        name: name.trim(),
        section: section as string,
        department: department.trim() || "AIML",
        batch: batch.trim() || "2022-2026",
      };
      if (email.trim()) payload.email = email.trim();
      createStudent.mutate(
        payload,
      {
        onSuccess: () => {
          toast.success("Student added successfully!", {
            description: `${name.trim()} (${regNo.trim().toUpperCase()}) enrolled in Section ${section}`,
          });
          onClose();
          navigate({
            to: "/grade-entry",
            search: {
              section: section as Section,
              reg: regNo.trim().toUpperCase(),
            },
          });
        },
        onError: (error: any) => {
          toast.error("Failed to add student", { description: error.message });
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-title"
    >
      <div className="w-full max-w-lg animate-rise overflow-hidden rounded-3xl border border-border/80 bg-panel shadow-[0_30px_80px_-20px_color-mix(in_oklab,var(--accent-cyan)_30%,transparent)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-content-center rounded-xl bg-gradient-primary">
              <UserPlus className="h-4 w-4 text-primary-foreground" />
            </span>
            <div>
              <h2 id="add-student-title" className="font-display text-base font-bold">
                Add New Student
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Enrol a student and proceed to grade entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add student modal"
            className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-danger/60 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Register No + Name row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="student-reg-no" className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                Register No <span className="text-danger">*</span>
              </label>
              <input
                id="student-reg-no"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. 24ADA001"
                autoFocus
                className={`w-full rounded-xl border bg-secondary/60 px-3 py-2.5 text-sm font-mono outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_18%,transparent)] ${
                  formErrors.regNo ? "border-danger/70" : "border-border"
                }`}
              />
              {formErrors.regNo && <p className="mt-1 text-xs text-danger">{formErrors.regNo}</p>}
            </div>

            <div>
              <label htmlFor="student-name" className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                id="student-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya R"
                className={`w-full rounded-xl border bg-secondary/60 px-3 py-2.5 text-sm outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_18%,transparent)] ${
                  formErrors.name ? "border-danger/70" : "border-border"
                }`}
              />
              {formErrors.name && <p className="mt-1 text-xs text-danger">{formErrors.name}</p>}
            </div>
          </div>

          {/* Section */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
              Section <span className="text-danger">*</span>
            </label>
            <div className="flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSection(s)}
                  className={`flex-1 rounded-lg py-2 font-display text-sm font-bold transition-all ${
                    s === section
                      ? "bg-gradient-primary text-primary-foreground shadow-[0_0_14px_color-mix(in_oklab,var(--accent-cyan)_30%,transparent)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {formErrors.section && <p className="mt-1 text-xs text-danger">{formErrors.section}</p>}
          </div>

          {/* Department + Batch row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="student-department" className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                Department
              </label>
              <input
                id="student-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_18%,transparent)]"
              />
            </div>
            <div>
              <label htmlFor="student-batch" className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                Batch
              </label>
              <input
                id="student-batch"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_18%,transparent)]"
              />
            </div>
          </div>

          {/* Email (optional) */}
          <div>
            <label htmlFor="student-email" className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
              Email{" "}
              <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
                (optional)
              </span>
            </label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className={`w-full rounded-xl border bg-secondary/60 px-3 py-2.5 text-sm outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_18%,transparent)] ${
                formErrors.email ? "border-danger/70" : "border-border"
              }`}
            />
            {formErrors.email && <p className="mt-1 text-xs text-danger">{formErrors.email}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-cyan/40 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              id="add-student-submit"
              type="submit"
              disabled={createStudent.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-70"
            >
              {createStudent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {createStudent.isPending ? "Adding…" : "Add Student & Enter Grades"}
              {!createStudent.isPending && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
