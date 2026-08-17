import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateSemester } from "@/hooks/useApi";

export function AddSemesterModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const createSemester = useCreateSemester();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !label) {
      toast.error("Please fill in all fields");
      return;
    }

    createSemester.mutate(
      { value, label },
      {
        onSuccess: () => {
          toast.success("Semester added successfully!");
          onClose();
        },
        onError: (err: any) => {
          toast.error("Failed to add semester", { description: err.message });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-display font-bold mb-1">Add New Semester</h2>
        <p className="text-sm text-muted-foreground mb-6">Create a new semester across the portal.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Semester Value (e.g., 3, 4, 7)
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 3"
              className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm focus:border-cyan outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Display Label (e.g., III Semester)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. III Semester"
              className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm focus:border-cyan outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSemester.isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground disabled:opacity-70"
            >
              {createSemester.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Semester
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
