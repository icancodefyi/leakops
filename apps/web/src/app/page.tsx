import Link from "next/link";

const steps = [
  { step: "1", label: "Submit", sub: "Media / URL" },
  { step: "2", label: "Agents", sub: "Investigate" },
  { step: "3", label: "Respond", sub: "Packet ready" },
];

const nciiFeatures = [
  "Route Discovery",
  "DMCA Links",
  "Required Fields",
  "Abuse Contacts",
  "Notice Drafts",
];

const prioritySignals = [
  ["Urgent", "Primary notice and escalation are prepared first."],
  ["Required", "Source link, platform, and NCII policy frame."],
  ["Optional", "Long story and extra screenshots can be added later."],
];

export default function Page() {
  return (
    <div className="sniffer-page">
      <header className="sniffer-header px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/"
            className="font-mono text-[13px] uppercase tracking-widest text-[var(--color-ink)] transition-opacity hover:opacity-70"
          >
            LeakOps
          </Link>
          <span className="text-[var(--color-faint)]">/</span>
          <span className="text-[13px] text-[var(--color-subtle)]">Start</span>
          <Link
            href="/case/demo-001"
            className="ml-auto hidden rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] sm:inline-flex"
          >
            Demo report
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-10 text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-indigo-500">
            Agentic NCII response
          </p>
          <h1 className="serif-title mx-auto mb-4 max-w-2xl text-4xl leading-snug text-[var(--color-ink)]">
            Remove leaked intimate content.
          </h1>
          <p className="mx-auto max-w-xl text-[14px] leading-7 text-[var(--color-muted)]">
            Start with a source link or image. LeakOps runs an agent team to preserve
            evidence, find the takedown route, draft the notice, and queue escalation.
          </p>
        </div>

        <div className="mb-10 flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((item, index) => (
            <div key={item.step} className="flex items-center gap-2 sm:gap-4">
              <div className="text-center">
                <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-200 bg-indigo-50">
                  <span className="font-mono text-[11px] font-semibold text-indigo-600">
                    {item.step}
                  </span>
                </div>
                <p className="text-[12px] font-semibold text-[var(--color-ink)]">{item.label}</p>
                <p className="font-mono text-[10.5px] text-[var(--color-subtle)]">{item.sub}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="flex items-center pb-5">
                  <div className="h-px w-7 bg-[var(--color-line)] sm:w-10" />
                  <svg
                    width="8"
                    height="8"
                    fill="none"
                    stroke="#d4cfc9"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="-ml-px"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/new"
            className="group relative block rounded-2xl border border-rose-200 bg-white p-7 transition-all hover:border-rose-400 hover:shadow-[0_0_0_3px_rgba(244,63,94,0.07)]"
          >
            <div className="flex items-start gap-5">
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                  <path d="M2 12h4M18 12h4M12 2v4M12 18v4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                  <p className="text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
                    NCII takedown case
                  </p>
                  <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-rose-600">
                    Urgent path
                  </span>
                </div>
                <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
                  One focused workflow for non-consensual intimate imagery: intake,
                  route discovery, complaint drafting, and escalation.
                </p>
                <div className="flex flex-wrap gap-2">
                  {nciiFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-muted)]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] transition-colors group-hover:border-rose-300 group-hover:bg-rose-50">
                <svg width="13" height="13" fill="none" stroke="#f43f5e" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {prioritySignals.map(([label, copy]) => (
              <div key={label} className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className={`font-mono text-[10px] uppercase tracking-widest ${label === "Urgent" ? "text-rose-600" : "text-[var(--color-faint)]"}`}>
                  {label}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--color-muted)]">{copy}</p>
              </div>
            ))}
          </div>

          <Link
            href="/case/demo-001"
            className="group relative block rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] p-5 transition-all hover:border-[var(--color-subtle)] hover:bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.75">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12h8M8 16h5M8 8h8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <p className="text-[13.5px] font-semibold tracking-tight text-[var(--color-copy)]">
                    Skip to demo report
                  </p>
                  <span className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-line-soft)] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[var(--color-muted)]">
                    Hackathon demo
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--color-subtle)]">
                  Opens a fully populated mock case with agent output, route details, and notices.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
