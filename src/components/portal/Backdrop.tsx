import mark from "@/assets/rec-mark.png.asset.json";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_110%,var(--bg-skyline),var(--bg-base)_70%)]" />

      {/* college mark watermark */}
      <img
        src={mark.url}
        alt=""
        className="absolute left-1/2 top-1/2 w-[620px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.06] mix-blend-screen blur-[1px]"
      />

      {/* HUD rings */}
      <div className="absolute -right-40 top-10 h-[620px] w-[620px] rounded-full border border-cyan/10" />
      <div className="absolute -right-24 top-32 h-[420px] w-[420px] rounded-full border border-cyan/10" />
      <div className="absolute -left-32 bottom-24 h-[500px] w-[500px] rounded-full border border-violet/10" />

      {/* neural node drift */}
      <div
        className="absolute inset-0 opacity-[0.06] animate-[drift_60s_linear_infinite_alternate]"
        style={{
          backgroundImage:
            "radial-gradient(var(--accent-cyan) 1px, transparent 1.4px), radial-gradient(var(--accent-violet) 1px, transparent 1.4px)",
          backgroundSize: "90px 90px, 140px 140px",
          backgroundPosition: "0 0, 40px 60px",
        }}
      />

      {/* scanlines */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, var(--accent-cyan) 0 1px, transparent 1px 4px)",
        }}
      />

      {/* blurred skyline */}
      <div className="absolute inset-x-0 bottom-0 h-64 opacity-20 blur-[6px]">
        <div className="flex h-full items-end justify-center gap-1.5">
          {Array.from({ length: 46 }).map((_, i) => {
            const h = 20 + ((i * 37) % 72);
            return (
              <div
                key={i}
                className="w-6 rounded-t-sm bg-skyline"
                style={{ height: `${h}%` }}
              >
                <div
                  className="mx-auto mt-2 grid w-3 grid-cols-2 gap-[3px]"
                  aria-hidden
                >
                  {Array.from({ length: 8 }).map((__, j) => (
                    <span
                      key={j}
                      className="block h-[2px] w-[2px] rounded-full"
                      style={{
                        background:
                          (i + j) % 3 === 0 ? "var(--accent-cyan)" : "var(--accent-violet)",
                        opacity: (i + j) % 2 === 0 ? 0.9 : 0.35,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
