import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import aiConnection from "@/assets/ai-connection.png.asset.json";
import { useLogin } from "@/hooks/useApi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faculty Sign In | AIML SGPA & CGPA Portal" },
      {
        name: "description",
        content:
          "Secure faculty sign-in for the AIML department SGPA/CGPA portal — grade entry, toppers and result analytics.",
      },
      { property: "og:title", content: "Faculty Sign In | AIML SGPA & CGPA Portal" },
      {
        property: "og:description",
        content: "Faculty-only access to grade entry, SGPA/CGPA calculation and semester analytics.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useLogin();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 4) {
      setError("Incorrect email or password");
      return;
    }
    
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      if (res && res.access_token) {
        localStorage.setItem("aiml.faculty", email);
        localStorage.setItem("aiml.token", res.access_token);
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  return (
    <div className="relative min-h-screen">
      <LoginBackground />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <ConnectionVisual />

        <div className="glass animate-rise mx-auto w-full max-w-[420px] rounded-3xl p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-content-center overflow-hidden rounded-2xl bg-background ring-1 ring-border">
              <img src="/new-logo.png" alt="Portal logo" className="h-full w-full object-cover" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-bold">Rajalakshmi Engineering College</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Department of AIML
              </div>
            </div>
          </div>

          <h1 className="mt-8 font-display text-2xl font-bold">Faculty Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access grade entry, SGPA/CGPA and semester analytics.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                Email
              </span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@agni.edu"
                  className="w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-3 text-sm outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_20%,transparent)]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-3 text-sm outline-none transition-shadow focus:border-cyan focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-cyan)_20%,transparent)]"
                />
              </span>
            </label>

            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="animate-glow w-full rounded-xl bg-gradient-primary py-3 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">Faculty access only</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Forgot password? Contact admin
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <img src={aiConnection.url} alt="" className="h-full w-full scale-105 object-cover opacity-40 blur-[2px]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_30%,transparent_0%,color-mix(in_oklab,var(--background)_78%,transparent)_55%,var(--background)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-background/95" />
      <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-cyan/10 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet/10 blur-3xl" />
    </div>
  );
}

function ConnectionVisual() {
  return (
    <div aria-hidden className="relative hidden lg:block">
      <div className="relative overflow-hidden rounded-[28px] ring-1 ring-border shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--accent-cyan)_45%,transparent)]">
        <img src={aiConnection.url} alt="" className="h-[420px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 p-6">
          <img
            src="/new-logo.png"
            alt="College Logo"
            className="w-56 rounded-lg bg-background/85 p-2 ring-1 ring-border"
          />
          <p className="font-display text-sm font-semibold text-foreground/90">
            Department of Artificial Intelligence &amp; Machine Learning
          </p>
        </div>
      </div>
    </div>
  );
}
