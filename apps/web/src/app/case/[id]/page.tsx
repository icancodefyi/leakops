import Link from "next/link";

type CasePageProps = {
  params: Promise<{ id: string }>;
};

const steps = [
  { num: "01", label: "Evidence", state: "complete" },
  { num: "02", label: "Route Discovery", state: "active" },
  { num: "03", label: "Takedown Packet", state: "ready" },
];

const caseFields = [
  { label: "Case Ref", value: "LO-23891", mono: true },
  { label: "Date Filed", value: "14 Jun 2026" },
  { label: "Source", value: "ExampleTube" },
  { label: "Issue Type", value: "NCII leak" },
  { label: "Report Type", value: "Anonymous" },
];

const agents = [
  {
    name: "Intake Agent",
    status: "Complete",
    tone: "emerald",
    output: "Classified the case as non-consensual intimate imagery with a direct source URL.",
  },
  {
    name: "Evidence Agent",
    status: "Complete",
    tone: "emerald",
    output: "Generated media hash, extracted visible timestamp, and preserved source screenshot notes.",
  },
  {
    name: "Platform Detection Agent",
    status: "Complete",
    tone: "emerald",
    output: "Matched domain to adult-video hosting category with public takedown surface expected.",
  },
  {
    name: "Route Discovery Agent",
    status: "Verified",
    tone: "indigo",
    output: "Found a removal form under /legal/takedown and inferred the required submission fields.",
  },
  {
    name: "Notice Agent",
    status: "Ready",
    tone: "rose",
    output: "Prepared short complaint text, formal abuse email, and 24-hour escalation follow-up.",
  },
];

const routeFields = [
  { label: "Route type", value: "Verified form" },
  { label: "Removal page", value: "exampletube.com/legal/takedown" },
  { label: "Contact email", value: "abuse@exampletube.com" },
  { label: "Login required", value: "No" },
  { label: "Confidence", value: "94%" },
];

const requiredFields = [
  "content_url",
  "email",
  "reason",
  "supporting_details",
  "signature",
];

const evidenceRows = [
  ["Source URL", "https://exampletube.com/watch/leaked-post-23891"],
  ["Detected platform", "ExampleTube / adult video host"],
  ["Visible timestamp", "14 Jun 2026, 12:41 IST"],
  ["Media hash", "9f4e...a21c"],
  ["Policy frame", "Non-consensual intimate imagery"],
];

const actionItems = [
  "Submit the short complaint through the verified takedown form.",
  "Send the formal notice to abuse@exampletube.com after form submission.",
  "Save the confirmation screenshot into the case packet.",
  "Escalate to host or registrar if there is no response after 24 hours.",
];

function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-[#e8e4de] bg-[#fafaf8] text-[#9ca3af]",
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${styles[tone] ?? styles.slate}`}>
      {children}
    </span>
  );
}

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params;

  return (
    <div className="sniffer-page">
      <header className="sniffer-header sticky top-0 z-10 bg-white/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/"
            className="font-mono text-[13px] font-bold uppercase tracking-widest text-[var(--color-ink)] transition-opacity hover:opacity-70"
          >
            LeakOps
          </Link>
          <span className="text-[var(--color-faint)]">/</span>
          <span className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--color-subtle)]">
            Agent Report
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/new"
              className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] text-[var(--color-muted)] hover:border-[var(--color-faint)] hover:text-[var(--color-ink)]"
            >
              New case
            </Link>
            <button className="rounded-lg bg-[var(--color-ink)] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a1a1a]">
              Export packet
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
              Case {id}
            </p>
            <h1 className="serif-title mt-2 text-3xl leading-tight text-[var(--color-ink)]">
              Takedown-ready incident packet
            </h1>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-faint)]">
              Verdict
            </p>
            <p className="mt-0.5 font-mono text-[13px] font-bold uppercase tracking-wide text-rose-600">
              Action required
            </p>
          </div>
        </div>

        <nav className="mb-8 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
          <div className="flex">
            {steps.map((step, index) => {
              const active = step.state === "active";
              const done = step.state === "complete";
              return (
                <div
                  key={step.num}
                  className={`flex flex-1 items-center gap-3 px-4 py-3.5 ${
                    index < steps.length - 1 ? "border-r border-[var(--color-line)]" : ""
                  } ${active ? "bg-[var(--color-ink)] text-white" : done ? "bg-emerald-50/80 text-emerald-800" : "bg-white text-[var(--color-subtle)]"}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${
                      active
                        ? "bg-white/15 text-white"
                        : done
                          ? "bg-emerald-200/80 text-emerald-700"
                          : "bg-[var(--color-line-soft)] text-[var(--color-faint)]"
                    }`}
                  >
                    {done ? (
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-[12.5px] font-semibold ${active ? "text-white" : "text-[var(--color-copy)]"}`}>
                      {step.label}
                    </p>
                    <p className={`mt-0.5 font-mono text-[10px] ${active ? "text-white/50" : "text-[var(--color-faint)]"}`}>
                      {done ? "Completed" : active ? "In progress" : "Ready"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-0.5 bg-[var(--color-line-soft)]">
            <div className="h-full w-2/3 bg-[var(--color-ink)]" />
          </div>
        </nav>

        <section className="mb-6 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-5">
            {caseFields.map((field, index) => (
              <div
                key={field.label}
                className={`px-4 py-4 ${index < caseFields.length - 1 ? "border-r border-[var(--color-line-soft)]" : ""} ${
                  index >= 2 ? "border-t border-[var(--color-line-soft)] sm:border-t-0" : ""
                }`}
              >
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
                  {field.label}
                </p>
                <p className={`text-[13px] font-semibold leading-tight text-[var(--color-ink)] ${field.mono ? "font-mono tracking-tight" : ""}`}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-line-soft)] bg-[var(--color-canvas)] px-4 py-3.5">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
              User statement
            </p>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-copy)]">
              A private image appears to have been posted without consent. The user needs
              the fastest confirmed removal route and a prepared escalation packet.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <section className="space-y-5 lg:col-span-2">
            <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">
                  Evidence summary
                </p>
                <StatusPill tone="emerald">Preserved</StatusPill>
              </div>
              <div className="mb-4 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
                <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-[var(--color-line)] bg-white">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-xl border border-[var(--color-line)] bg-[var(--color-line-soft)]" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">
                      Screenshot evidence
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-[var(--color-line-soft)] rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)]">
                {evidenceRows.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="font-mono text-[9.5px] uppercase tracking-widest text-[var(--color-faint)]">
                      {label}
                    </span>
                    <span className="max-w-52 text-right text-[11.5px] leading-5 text-[var(--color-copy)]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">
                Required fields
              </p>
              <div className="flex flex-wrap gap-2">
                {requiredFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--color-muted)]"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5 lg:col-span-3">
            <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 bg-[var(--color-ink)] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">
                    Agent timeline
                  </p>
                </div>
                <span className="font-mono text-[10px] text-white/30">5 complete</span>
              </div>
              <div className="space-y-3 p-5">
                {agents.map((agent) => (
                  <div key={agent.name} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--color-ink)]">{agent.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">
                          Mock output
                        </p>
                      </div>
                      <StatusPill tone={agent.tone}>{agent.status}</StatusPill>
                    </div>
                    <p className="text-[12px] leading-6 text-[var(--color-copy)]">{agent.output}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">
                    Route discovery
                  </p>
                  <StatusPill tone="indigo">Verified</StatusPill>
                </div>
                <div className="space-y-2">
                  {routeFields.map((field) => (
                    <div
                      key={field.label}
                      className="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] px-3 py-2.5"
                    >
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-faint)]">
                        {field.label}
                      </p>
                      <p className="mt-1 text-[12.5px] font-semibold text-[var(--color-copy)]">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">
                    Action packet
                  </p>
                  <StatusPill tone="rose">Ready</StatusPill>
                </div>
                <div className="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] p-4">
                  <p className="mb-2 text-[12px] font-semibold text-[var(--color-ink)]">
                    Short form complaint
                  </p>
                  <p className="text-[12px] leading-6 text-[var(--color-copy)]">
                    This content is non-consensual intimate imagery. Please remove the
                    referenced post, cached media, and any mirrored copies immediately.
                  </p>
                </div>
                <button className="mt-4 w-full rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-[12.5px] font-medium text-white hover:bg-[#1a1a1a]">
                  Copy complaint
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">
                Guided next steps
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {actionItems.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                      <span className="font-mono text-[10px] text-[var(--color-copy)]">{index + 1}</span>
                    </div>
                    <p className="text-[12px] leading-6 text-[var(--color-copy)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
