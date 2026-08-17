import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, LayoutDashboard, LogOut, PenLine, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Backdrop } from "./Backdrop";
import { SEMESTERS, SEMESTER_LABELS } from "@/lib/portal-data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/grade-entry", label: "Grade Entry", icon: PenLine },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/subject-analysis", label: "Subject Analysis", icon: BarChart3 },
  { to: "/student-result", label: "Student Result", icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [faculty, setFaculty] = useState("Faculty");

  useEffect(() => {
    const stored = localStorage.getItem("aiml.faculty");
    if (stored) setFaculty((stored.split("@")[0] ?? "Faculty").replace(/\./g, " "));
  }, []);

  return (
    <div className="min-h-screen">
      <Backdrop />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-5 py-3">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-content-center overflow-hidden rounded-xl bg-background ring-1 ring-border">
              <img src="/new-logo.png" alt="Portal logo" className="h-full w-full object-cover" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold">Rajalakshmi Engineering College</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Department of AIML
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-cyan",
                    active && "bg-cyan/10 text-cyan ring-1 ring-cyan/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">

            <span className="hidden text-xs capitalize text-muted-foreground sm:block">{faculty}</span>
            <button
              onClick={() => {
                localStorage.removeItem("aiml.faculty");
                navigate({ to: "/" });
              }}
              aria-label="Log out"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8">{children}</main>
    </div>
  );
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
