"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";

export type TakedownRoute = {
  domain: string;
  cdnProvider: string;
  providerType: string;
  removalPageUrl: string;
  removalType: string;
  contactEmail: string;
  lastChecked: string;
  dataQuality: number;
};

type Stage = "intake" | "scan" | "findings" | "report";
type IntakeStep = "evidence" | "context" | "review";

type WorklogEntry = {
  time: string;
  agent: string;
  message: string;
};

type NewCaseFlowProps = {
  routes: TakedownRoute[];
};

const platforms = ["Telegram", "Instagram", "Reddit", "X", "Adult site", "Forum", "Unknown"];
const urgencyLevels = ["Immediate", "24h follow-up", "Monitoring"];
const issueType = "NCII leak";

const intakeSteps: Array<{ id: IntakeStep; label: string; title: string; copy: string }> = [
  {
    id: "evidence",
    label: "Evidence",
    title: "Add the source.",
    copy: "Start with an image or a live link. The agents only need one reliable starting point.",
  },
  {
    id: "context",
    label: "Case",
    title: "Set priority.",
    copy: "This flow is tuned for NCII takedowns. Mark urgency and platform so the agents know what to prioritize.",
  },
  {
    id: "review",
    label: "Review",
    title: "Launch the agents.",
    copy: "Confirm the mock packet before the orchestrator scans routes from the CSV dataset.",
  },
];

const agentTasks = [
  {
    name: "Intake Agent",
    action: "classifying incident type, urgency, and source context",
    result: "case classified and routed",
  },
  {
    name: "Evidence Agent",
    action: "extracting OCR text, timestamp clues, and media hash",
    result: "evidence preserved",
  },
  {
    name: "Platform Agent",
    action: "matching source domain against known networks",
    result: "platform surface identified",
  },
  {
    name: "Route Discovery Agent",
    action: "checking DMCA, abuse, legal, privacy, and support routes",
    result: "primary takedown route selected",
  },
  {
    name: "Notice Agent",
    action: "preparing required fields and complaint language",
    result: "notice packet drafted",
  },
  {
    name: "Escalation Agent",
    action: "preparing host, registrar, and 24-hour fallback steps",
    result: "fallback path ready",
  },
];

const stageLabels: Array<{ id: Stage; label: string }> = [
  { id: "intake", label: "Intake" },
  { id: "scan", label: "Scan" },
  { id: "findings", label: "Findings" },
  { id: "report", label: "Report" },
];

const evidenceRows = [
  ["Media hash", "9f4e12...a21c88"],
  ["OCR signal", "mirror / repost / non-consensual caption"],
  ["Timestamp", "14 Jun 2026, 12:41 IST"],
  ["Policy frame", "Non-consensual intimate imagery"],
];

const priorityItems = [
  {
    label: "Source link",
    level: "Required",
    detail: "The agents need the live post, mirror, or channel link to select the correct route.",
  },
  {
    label: "Urgency",
    level: "Critical",
    detail: "Immediate cases go first, with fallback escalation prepared during the same run.",
  },
  {
    label: "Screenshot or image",
    level: "Useful",
    detail: "Helpful for proof and hashing, but the demo can run from a link alone.",
  },
  {
    label: "Long explanation",
    level: "Optional",
    detail: "Keep notes short. The notice agent turns them into formal complaint language.",
  },
];

function routeFields(route: TakedownRoute): string[] {
  if (route.removalType === "form") {
    return ["content_url", "email", "reason", "description"];
  }
  if (route.removalType === "email") {
    return ["subject", "content_url", "evidence_summary"];
  }
  return ["domain", "evidence_summary", "operator_contact"];
}

function qualityTone(route: TakedownRoute): string {
  if (route.dataQuality >= 3) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (route.dataQuality === 2) return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-subtle)]";
}

function priorityTone(priority: string): string {
  if (priority === "Urgent") return "border-rose-100 bg-rose-50 text-rose-600";
  if (priority === "Required") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-subtle)]";
}

function stageIndex(stage: Stage) {
  return stageLabels.findIndex((item) => item.id === stage);
}

function intakeStepIndex(step: IntakeStep) {
  return intakeSteps.findIndex((item) => item.id === step);
}

function formatLogTime() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function StageRail({ stage }: { stage: Stage }) {
  const activeIndex = stageIndex(stage);

  return (
    <div className="mb-8 rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
      <div className="grid grid-cols-4">
        {stageLabels.map((item, index) => {
          const active = item.id === stage;
          const complete = index < activeIndex;
          return (
            <div
              key={item.id}
              className={`px-4 py-3 ${index < stageLabels.length - 1 ? "border-r border-[var(--color-line)]" : ""} ${
                active ? "bg-[var(--color-ink)] text-white" : "bg-white"
              }`}
            >
              <p className={`font-mono text-[10px] uppercase tracking-widest ${active ? "text-white/50" : "text-[var(--color-faint)]"}`}>
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className={`mt-1 text-[12.5px] font-semibold ${active ? "text-white" : complete ? "text-emerald-700" : "text-[var(--color-copy)]"}`}>
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="h-0.5 bg-[var(--color-line-soft)]">
        <div
          className="h-full bg-[var(--color-ink)] transition-all duration-500"
          style={{ width: `${((activeIndex + 1) / stageLabels.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function IntakeStepper({ step }: { step: IntakeStep }) {
  const activeIndex = intakeStepIndex(step);

  return (
    <div className="grid grid-cols-3 border-b border-[var(--color-line-soft)]">
      {intakeSteps.map((item, index) => {
        const active = item.id === step;
        const complete = index < activeIndex;
        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-5 py-4 ${index < intakeSteps.length - 1 ? "border-r border-[var(--color-line-soft)]" : ""}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : complete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[var(--color-line)] bg-white text-[var(--color-subtle)]"
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-[12.5px] font-semibold ${active ? "text-[var(--color-ink)]" : "text-[var(--color-subtle)]"}`}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RouteBadge({ route }: { route: TakedownRoute }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${qualityTone(route)}`}>
      Q{route.dataQuality}
    </span>
  );
}

export function NewCaseFlow({ routes }: NewCaseFlowProps) {
  const [stage, setStage] = useState<Stage>("intake");
  const [intakeStep, setIntakeStep] = useState<IntakeStep>("evidence");
  const [platform, setPlatform] = useState("Telegram");
  const [urgency, setUrgency] = useState("Immediate");
  const [sourceUrl, setSourceUrl] = useState("https://t.me/example-channel/23891");
  const [notes, setNotes] = useState("Private image reposted without consent. Need urgent removal and escalation packet.");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [agentStep, setAgentStep] = useState(0);
  const [worklog, setWorklog] = useState<WorklogEntry[]>([]);

  const visibleRoutes = useMemo(() => routes.slice(0, 6), [routes]);
  const primaryRoute = visibleRoutes[0];
  const currentRoute = visibleRoutes[Math.min(scanStep, visibleRoutes.length - 1)] ?? primaryRoute;
  const currentAgent = agentTasks[Math.min(agentStep, agentTasks.length - 1)];
  const currentIntakeStep = intakeSteps[intakeStepIndex(intakeStep)];
  const caseRef = "LO-23891";

  const discoveredCount = useMemo(
    () => visibleRoutes.filter((_, index) => index <= scanStep).length,
    [scanStep, visibleRoutes],
  );

  const actionQueue = useMemo(() => {
    if (!primaryRoute) return [];

    return [
      {
        label: "Submit primary notice",
        owner: "Notice Agent",
        detail: `Use ${primaryRoute.removalType || "manual"} route for ${primaryRoute.domain}`,
        cta: "Ready",
        priority: "Urgent",
      },
      {
        label: "Attach evidence packet",
        owner: "Evidence Agent",
        detail: "Media hash, timestamp, source URL, and screenshot are bundled",
        cta: "Packed",
        priority: "Required",
      },
      {
        label: "Send fallback escalation",
        owner: "Escalation Agent",
        detail: primaryRoute.contactEmail || `Escalate to host if ${primaryRoute.domain} does not respond`,
        cta: "Queued",
        priority: "Urgent",
      },
      {
        label: "Monitor mirrors",
        owner: "Platform Agent",
        detail: `Watch ${visibleRoutes.slice(1, 4).map((route) => route.domain).join(", ")}`,
        cta: "Watching",
        priority: "Follow-up",
      },
    ];
  }, [primaryRoute, visibleRoutes]);

  useEffect(() => {
    if (stage !== "scan") return;

    const timers = visibleRoutes.map((_, index) =>
      window.setTimeout(() => {
        setScanStep(index);
        setScanProgress(Math.round(((index + 1) / visibleRoutes.length) * 100));
      }, index * 760),
    );
    const agentTimers = agentTasks.map((agent, index) =>
      window.setTimeout(() => {
        setAgentStep(index);
        setWorklog((current) =>
          [
            {
              time: formatLogTime(),
              agent: agent.name,
              message: agent.result,
            },
            ...current,
          ].slice(0, 6),
        );
      }, index * 700),
    );
    const doneAfter = Math.max(visibleRoutes.length * 760, agentTasks.length * 700);
    const done = window.setTimeout(() => setStage("findings"), doneAfter + 900);

    return () => {
      timers.forEach(window.clearTimeout);
      agentTimers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [stage, visibleRoutes]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function goToNextIntakeStep() {
    const nextStep = intakeSteps[intakeStepIndex(intakeStep) + 1];
    if (nextStep) setIntakeStep(nextStep.id);
  }

  function goToPreviousIntakeStep() {
    const previousStep = intakeSteps[intakeStepIndex(intakeStep) - 1];
    if (previousStep) setIntakeStep(previousStep.id);
  }

  function loadDemoCase() {
    setSourceUrl("https://t.me/example-channel/23891");
    setPlatform("Telegram");
    setUrgency("Immediate");
    setNotes("Private image reposted without consent. Need urgent removal and escalation packet.");
    setIntakeStep("review");
  }

  function startScan() {
    setScanStep(0);
    setScanProgress(0);
    setAgentStep(0);
    setWorklog([
      {
        time: formatLogTime(),
        agent: "Orchestrator",
        message: "created agent run and assigned case tasks",
      },
    ]);
    setStage("scan");
  }

  return (
    <div className="sniffer-page">
      <header className="sniffer-header px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/" className="font-mono text-[13px] font-bold uppercase tracking-widest text-[var(--color-ink)] hover:opacity-70">
            LeakOps
          </Link>
          <span className="text-[var(--color-faint)]">/</span>
          <span className="text-[13px] text-[var(--color-subtle)]">Case builder</span>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)] sm:inline">
            CSV routes loaded: {routes.length}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-500">
              Agentic takedown flow
            </p>
            <h1 className="serif-title text-3xl leading-snug text-[var(--color-ink)]">
              Prepare a removal packet.
            </h1>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 sm:text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-faint)]">Case ref</p>
            <p className="mt-1 font-mono text-[13px] font-bold text-[var(--color-ink)]">{caseRef}</p>
          </div>
        </div>

        <StageRail stage={stage} />

        {stage === "intake" && (
          <section className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
            <IntakeStepper step={intakeStep} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px]">
              <div className="min-h-[430px] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
                      Step {intakeStepIndex(intakeStep) + 1} of {intakeSteps.length}
                    </p>
                    <h2 className="serif-title mt-3 text-4xl leading-tight text-[var(--color-ink)]">{currentIntakeStep.title}</h2>
                    <p className="mt-3 max-w-xl text-[13px] leading-7 text-[var(--color-muted)]">{currentIntakeStep.copy}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadDemoCase}
                    className="hidden rounded-full border border-[var(--color-line)] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] sm:block"
                  >
                    Use mock case
                  </button>
                </div>

                {intakeStep === "evidence" && (
                  <div className="mt-8 space-y-5">
                    <label className="block cursor-pointer overflow-hidden rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] transition-colors hover:border-[var(--color-subtle)] hover:bg-white">
                      <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                      {previewUrl ? (
                        <img src={previewUrl} alt="Uploaded evidence preview" className="h-64 w-full object-cover" />
                      ) : (
                        <div className="flex h-64 items-center justify-center text-center">
                          <div>
                            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white">
                              <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                              </svg>
                            </div>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">Upload image evidence</p>
                            <p className="mt-2 text-[12px] text-[var(--color-muted)]">Useful, not required for the demo.</p>
                          </div>
                        </div>
                      )}
                    </label>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Source link</label>
                        <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-rose-600">
                          Required
                        </span>
                      </div>
                      <input
                        value={sourceUrl}
                        onChange={(event) => setSourceUrl(event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3 font-mono text-[12px] text-[var(--color-copy)] outline-none focus:border-[var(--color-ink)] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {intakeStep === "context" && (
                  <div className="mt-8 space-y-7">
                    <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-rose-600">Fixed response track</p>
                          <p className="mt-2 text-[16px] font-semibold text-[var(--color-ink)]">NCII leak takedown</p>
                          <p className="mt-2 max-w-xl text-[12.5px] leading-6 text-[var(--color-muted)]">
                            The product is now focused on non-consensual intimate imagery only. The agents prepare route discovery, notice drafting, and escalation around that policy frame.
                          </p>
                        </div>
                        <span className="rounded-full border border-rose-200 bg-white px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-rose-600">
                          Urgent
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-[12px] font-semibold text-[var(--color-copy)]">Where did it appear?</p>
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPlatform(item)}
                            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${
                              platform === item
                                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                                : "border-[var(--color-line)] bg-white text-[var(--color-copy)] hover:border-[var(--color-subtle)]"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-[12px] font-semibold text-[var(--color-copy)]">Urgency</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {urgencyLevels.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setUrgency(item)}
                            className={`rounded-xl border px-4 py-3 text-left text-[12.5px] font-medium transition-all ${
                              urgency === item
                                ? "border-rose-300 bg-rose-50 text-rose-700"
                                : "border-[var(--color-line)] bg-white text-[var(--color-copy)] hover:border-[var(--color-subtle)]"
                            }`}
                          >
                            <span className="block">{item}</span>
                            <span className="mt-1 block text-[10.5px] font-normal text-[var(--color-subtle)]">
                              {item === "Immediate" ? "Prioritize takedown now" : item === "24h follow-up" ? "Prepare escalation timer" : "Watch for mirrors"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-[12px] font-semibold text-[var(--color-copy)]">What matters for the agents?</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {priorityItems.map((item) => (
                          <div key={item.label} className="rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] font-semibold text-[var(--color-ink)]">{item.label}</p>
                              <span
                                className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                                  item.level === "Critical"
                                    ? "border-rose-100 bg-rose-50 text-rose-600"
                                    : item.level === "Required"
                                      ? "border-amber-100 bg-amber-50 text-amber-700"
                                      : "border-[var(--color-line)] bg-white text-[var(--color-subtle)]"
                                }`}
                              >
                                {item.level}
                              </span>
                            </div>
                            <p className="mt-2 text-[11.5px] leading-5 text-[var(--color-muted)]">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {intakeStep === "review" && (
                  <div className="mt-8 space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ["Source", sourceUrl],
                        ["Platform", platform],
                        ["Incident", issueType],
                        ["Urgency", urgency],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] px-4 py-3">
                          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-faint)]">{label}</p>
                          <p className="mt-1 break-words text-[12.5px] font-semibold text-[var(--color-copy)]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Case statement</label>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3 text-[12.5px] leading-6 text-[var(--color-copy)] outline-none focus:border-[var(--color-ink)] focus:bg-white"
                      />
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-indigo-500">Agents queued</p>
                        <span className="rounded-full border border-rose-100 bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-rose-600">
                          Urgent run
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          ["Preserve evidence", "Required"],
                          ["Scan CSV routes", "Required"],
                          ["Draft notice", "Urgent"],
                          ["Prepare escalation", "Urgent"],
                        ].map(([item, priority]) => (
                          <div key={item} className="rounded-lg border border-indigo-100 bg-white/70 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[12px] font-semibold text-[var(--color-copy)]">{item}</span>
                              <span className={`rounded-full border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider ${priorityTone(priority)}`}>
                                {priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <aside className="border-t border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] p-5 lg:border-l lg:border-t-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Live packet</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Evidence packet preview" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-[linear-gradient(180deg,var(--color-line-soft),var(--color-canvas))]">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">Mock evidence</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 divide-y divide-[var(--color-line-soft)] rounded-xl border border-[var(--color-line-soft)] bg-white">
                  {[
                    ["Case", caseRef],
                    ["Platform", platform],
                    ["Issue", issueType],
                    ["Urgency", urgency],
                    ["Routes", `${routes.length} CSV rows`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3 px-3.5 py-3">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-faint)]">{label}</span>
                      <span className="max-w-36 text-right text-[11.5px] font-semibold leading-5 text-[var(--color-copy)]">{value}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line-soft)] px-5 py-4">
              <button
                type="button"
                onClick={intakeStep === "evidence" ? loadDemoCase : goToPreviousIntakeStep}
                className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-[12.5px] font-medium text-[var(--color-copy)] hover:border-[var(--color-ink)]"
              >
                {intakeStep === "evidence" ? "Use mock data" : "Back"}
              </button>

              {intakeStep === "review" ? (
                <button
                  type="button"
                  onClick={startScan}
                  className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-[13px] font-medium text-white hover:bg-[#1a1a1a]"
                >
                  Start agent run
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextIntakeStep}
                  className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-[13px] font-medium text-white hover:bg-[#1a1a1a]"
                >
                  Continue
                </button>
              )}
            </div>
          </section>
        )}

        {stage === "scan" && (
          <section className="overflow-hidden rounded-xl border border-[var(--color-ink)] bg-[var(--color-ink)] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-rose-400 status-pulse" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Agent run active</p>
              </div>
              <span className="font-mono text-[10px] text-white/30">
                {discoveredCount}/{visibleRoutes.length} · {scanProgress}%
              </span>
            </div>

            <div className="scan-grid relative min-h-[560px] overflow-hidden p-6">
              <div className="scan-sweep pointer-events-none absolute left-0 right-0 top-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(99,102,241,0.24),transparent)]" />
              <div className="relative z-10 mx-auto max-w-3xl pt-4">
                <p className="serif-title text-4xl leading-tight text-white">Agents are working the case.</p>
                <p className="mt-3 text-[13px] leading-7 text-white/55">
                  Specialized agents are dividing the work: evidence preservation, platform
                  matching, route discovery, notice drafting, and escalation planning.
                </p>

                <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-xl">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">Current agent</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-300 status-pulse" />
                        <p className="font-mono text-[18px] font-semibold text-white">{currentAgent.name}</p>
                      </div>
                      <p className="mt-3 text-[13px] leading-7 text-white/65">
                        {currentAgent.action}.
                      </p>
                    </div>
                    <div className="min-w-52 rounded-lg border border-white/10 bg-black/15 px-4 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Current website</p>
                      <p className="mt-2 font-mono text-[13px] font-semibold text-white">{currentRoute.domain}</p>
                      <p className="mt-1 text-[11px] capitalize text-white/45">
                        {currentRoute.providerType.replace(/_/g, " ")} / {currentRoute.removalType || "unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-indigo-400 transition-all duration-500" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/10">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">Agent handoff</p>
                    </div>
                    <div className="divide-y divide-white/10">
                      {agentTasks.map((agent, index) => {
                        const complete = index < agentStep;
                        const active = index === agentStep;
                        return (
                          <div key={agent.name} className="flex items-center justify-between gap-4 px-4 py-3">
                            <div>
                              <p className={`font-mono text-[12px] ${active ? "text-white" : complete ? "text-emerald-200" : "text-white/35"}`}>
                                {agent.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-white/30">{complete ? agent.result : active ? agent.action : "waiting for handoff"}</p>
                            </div>
                            <span className={`font-mono text-[9.5px] uppercase tracking-wider ${active ? "text-indigo-200" : complete ? "text-emerald-300" : "text-white/25"}`}>
                              {complete ? "Done" : active ? "Working" : "Queued"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/10">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">Live worklog</p>
                    </div>
                    <div className="space-y-3 p-4">
                      {worklog.map((entry) => (
                        <div key={`${entry.time}-${entry.agent}-${entry.message}`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">{entry.agent}</p>
                            <p className="font-mono text-[10px] text-white/25">{entry.time}</p>
                          </div>
                          <p className="mt-1 text-[11.5px] leading-5 text-white/65">{entry.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/10">
                  <div className="grid grid-cols-[1fr_92px] border-b border-white/10 px-4 py-3 font-mono text-[9.5px] uppercase tracking-widest text-white/35">
                    <span>CSV route target</span>
                    <span>Status</span>
                  </div>
                  {visibleRoutes.map((route, index) => (
                    <div key={route.domain} className="grid grid-cols-[1fr_92px] items-center gap-4 border-b border-white/10 px-4 py-3 last:border-b-0">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[12px] text-white/85">{route.domain}</p>
                        <p className="truncate text-[11px] text-white/35">{route.removalPageUrl || "No direct route in dataset"}</p>
                      </div>
                      <span className={`font-mono text-[9.5px] uppercase tracking-wider ${index <= scanStep ? "text-emerald-300" : "text-white/25"}`}>
                        {index < scanStep ? "Done" : index === scanStep ? "Scanning" : "Queued"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {stage === "findings" && primaryRoute && (
          <section className="space-y-5">
            <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Findings</p>
                  <h2 className="serif-title text-3xl leading-tight text-[var(--color-ink)]">Primary route found.</h2>
                  <p className="mt-2 max-w-xl text-[13px] leading-7 text-[var(--color-muted)]">
                    The agent selected the highest quality route from the CSV and prepared fallback
                    paths for escalation.
                  </p>
                </div>
                <RouteBadge route={primaryRoute} />
              </div>

              <div className="mt-6 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Recommended report method</p>
                <p className="mt-2 font-mono text-[15px] font-semibold text-[var(--color-ink)]">{primaryRoute.domain}</p>
                <p className="mt-1 break-words text-[12.5px] leading-6 text-[var(--color-copy)]">
                  {primaryRoute.removalPageUrl || primaryRoute.contactEmail || "No direct route found"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {actionQueue.map((action) => (
                  <div key={action.label} className="rounded-xl border border-[var(--color-line-soft)] bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] font-semibold text-[var(--color-ink)]">{action.label}</p>
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${priorityTone(action.priority)}`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[var(--color-faint)]">{action.owner}</p>
                    <p className="mt-2 text-[11.5px] leading-5 text-[var(--color-muted)]">{action.detail}</p>
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-[var(--color-subtle)]">{action.cta}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_112px_100px] border-b border-[var(--color-line-soft)] bg-[var(--color-canvas)] px-4 py-3 font-mono text-[9.5px] uppercase tracking-widest text-[var(--color-faint)]">
                <span>Website</span>
                <span>Method</span>
                <span>Quality</span>
              </div>
              {visibleRoutes.map((route) => (
                <div key={route.domain} className="grid grid-cols-[1fr_112px_100px] items-center border-b border-[var(--color-line-soft)] px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12px] font-semibold text-[var(--color-copy)]">{route.domain}</p>
                    <p className="truncate text-[11px] text-[var(--color-subtle)]">{route.removalPageUrl || route.contactEmail || "No direct URL"}</p>
                  </div>
                  <span className="text-[12px] capitalize text-[var(--color-copy)]">{route.removalType || "unknown"}</span>
                  <RouteBadge route={route} />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStage("report")}
                className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-[13px] font-medium text-white hover:bg-[#1a1a1a]"
              >
                Generate forensic report
              </button>
            </div>
          </section>
        )}

        {stage === "report" && primaryRoute && (
          <section className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-5">
                {[
                  ["Case Ref", caseRef],
                  ["Date Filed", "14 Jun 2026"],
                  ["Source", platform],
                  ["Issue Type", issueType],
                  ["Grade", "A-"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`px-4 py-4 ${index < 4 ? "border-r border-[var(--color-line-soft)]" : ""} ${index >= 2 ? "border-t border-[var(--color-line-soft)] sm:border-t-0" : ""}`}
                  >
                    <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-faint)]">{label}</p>
                    <p className="text-[13px] font-semibold leading-tight text-[var(--color-ink)]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-line-soft)] bg-[var(--color-canvas)] px-4 py-3.5">
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-faint)]">Case statement</p>
                <p className="text-[12.5px] leading-relaxed text-[var(--color-copy)]">{notes}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Evidence</p>
                <div className="mb-4 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Evidence preview" className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 items-center justify-center">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">Mock evidence preview</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-[var(--color-line-soft)] rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)]">
                  {evidenceRows.map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="font-mono text-[9.5px] uppercase tracking-widest text-[var(--color-faint)]">{label}</span>
                      <span className="max-w-56 text-right text-[11.5px] leading-5 text-[var(--color-copy)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
                  <div className="bg-[var(--color-ink)] px-5 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Final reporting method</p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ["Website", primaryRoute.domain],
                        ["Method", primaryRoute.removalType || "unknown"],
                        ["Route", primaryRoute.removalPageUrl || primaryRoute.contactEmail],
                        ["Required fields", routeFields(primaryRoute).join(", ")],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] px-3 py-2.5">
                          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-faint)]">{label}</p>
                          <p className="mt-1 break-words text-[12.5px] font-semibold text-[var(--color-copy)]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-soft)] p-4">
                      <p className="mb-2 text-[12px] font-semibold text-[var(--color-ink)]">Generated complaint text</p>
                      <p className="text-[12px] leading-6 text-[var(--color-copy)]">
                        This report concerns non-consensual intimate imagery linked to {sourceUrl}.
                        Please remove the post, cached media, thumbnails, and mirrored copies immediately.
                        The attached packet includes a source URL, media hash, timestamp, and policy framing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--color-faint)]">Next actions</p>
                  <div className="space-y-3">
                    {actionQueue.map((action, index) => (
                      <div key={action.label} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] font-mono text-[10px] text-[var(--color-copy)]">
                          {index + 1}
                        </span>
                        <span>
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[12.5px] font-semibold text-[var(--color-copy)]">{action.label}</span>
                            <span className={`rounded-full border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider ${priorityTone(action.priority)}`}>
                              {action.priority}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[11.5px] leading-5 text-[var(--color-muted)]">{action.detail}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
