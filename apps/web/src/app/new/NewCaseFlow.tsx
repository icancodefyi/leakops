"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

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

type Stage = "submit" | "agents" | "report";

type NewCaseFlowProps = {
  routes: TakedownRoute[];
};

const caseRef = "LO-23891";

const workflowSteps: Array<{ id: Stage; step: string; label: string; sub: string }> = [
  { id: "submit", step: "1", label: "Submit", sub: "Source" },
  { id: "agents", step: "2", label: "Agents", sub: "Route scan" },
  { id: "report", step: "3", label: "Report", sub: "Ready" },
];

const agentSteps = [
  {
    agent: "Intake Agent",
    label: "Open NCII case",
    detail: "Locks the policy frame and assigns an urgent response track.",
  },
  {
    agent: "Evidence Agent",
    label: "Preserve source evidence",
    detail: "Captures source URL, timestamp, screenshot note, and media hash.",
  },
  {
    agent: "Route Agent",
    label: "Match takedown routes",
    detail: "Searches the CSV route registry for forms, DMCA links, and abuse contacts.",
  },
  {
    agent: "Notice Agent",
    label: "Draft removal request",
    detail: "Builds the complaint body with required fields for the selected route.",
  },
  {
    agent: "Escalation Agent",
    label: "Queue fallback",
    detail: "Prepares host and legal-contact escalation if the platform does not respond.",
  },
];

const evidenceRows = [
  ["Case type", "NCII leak"],
  ["Priority", "Immediate"],
  ["Policy", "Non-consensual intimate imagery"],
  ["Hash", "9f4e12...a21c88"],
];

function stageIndex(stage: Stage) {
  return workflowSteps.findIndex((item) => item.id === stage);
}

function safeHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "source pending";
  }
}

function routeFields(route: TakedownRoute): string[] {
  if (route.removalType === "form") return ["content_url", "email", "reason", "description"];
  if (route.removalType === "email") return ["subject", "content_url", "evidence_summary"];
  return ["domain", "evidence_summary", "operator_contact"];
}

function qualityLabel(route: TakedownRoute) {
  if (route.dataQuality >= 3) return "Verified route";
  if (route.dataQuality === 2) return "Likely route";
  return "Manual review";
}

function WorkflowRail({ stage }: { stage: Stage }) {
  const activeIndex = stageIndex(stage);

  return (
    <div className="mb-10 flex items-center justify-center gap-2 sm:gap-4">
      {workflowSteps.map((item, index) => {
        const active = item.id === stage;
        const complete = index < activeIndex;

        return (
          <div key={item.id} className="flex items-center gap-2 sm:gap-4">
            <div className="text-center">
              <div
                className={`mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  active
                    ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                    : complete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-indigo-200 bg-indigo-50 text-indigo-600"
                }`}
              >
                <span className="font-mono text-[11px] font-semibold">{complete ? "OK" : item.step}</span>
              </div>
              <p className="text-[12px] font-semibold text-[#0a0a0a]">{item.label}</p>
              <p className="font-mono text-[10.5px] text-[#9ca3af]">{item.sub}</p>
            </div>
            {index < workflowSteps.length - 1 && (
              <div className="flex items-center pb-5">
                <div className="h-px w-7 bg-[#e8e4de] sm:w-10" />
                <svg width="8" height="8" fill="none" stroke="#d4cfc9" strokeWidth="2" viewBox="0 0 24 24" className="-ml-px">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UploadBox({
  previewUrl,
  onFile,
  onClear,
}: {
  previewUrl: string | null;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]">Evidence image</span>
        <span className="font-mono text-[10px] uppercase text-[#c4bdb5]">Optional</span>
      </div>
      <p className="mb-3 text-[11.5px] leading-relaxed text-[#9ca3af]">
        Add a screenshot if available. The source link is enough for the demo.
      </p>

      <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-[#d4cfc9] bg-white transition-all hover:border-[#0a0a0a] hover:bg-[#fafaf8]">
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        {previewUrl ? (
          <div className="flex items-start gap-4 p-4">
            <img src={previewUrl} alt="Evidence preview" className="h-16 w-16 shrink-0 rounded-xl border border-[#e8e4de] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#0a0a0a]">Evidence attached</p>
              <p className="mt-0.5 text-[12px] text-[#9ca3af]">Image preview is kept locally for this demo.</p>
              <button type="button" onClick={onClear} className="mt-2 text-[12px] text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
              <svg width="10" height="10" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <svg width="22" height="22" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[14px] font-medium text-[#374151]">Drop evidence image</p>
            <p className="font-mono text-[11px] text-[#c4bdb5]">JPG / PNG / WEBP</p>
          </div>
        )}
      </label>
    </div>
  );
}

function SourceCard({
  sourceUrl,
  sourceHost,
  routeCount,
}: {
  sourceUrl: string;
  sourceHost: string;
  routeCount: number;
}) {
  return (
    <div className="rounded-xl border border-[#f0ede8] bg-[#fafaf8] px-5 py-4">
      <div className="flex items-start gap-3">
        <svg width="14" height="14" fill="none" stroke="#a8a29e" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[12px] font-semibold text-[#374151]">What matters</p>
          <p className="text-[11.5px] leading-relaxed text-[#9ca3af]">
            Source link is required. Everything else is optional. LeakOps will infer platform, scan {routeCount} CSV routes, and prepare the takedown packet.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              ["Source", sourceHost],
              ["Case", "NCII"],
              ["Priority", "Immediate"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#e8e4de] bg-white px-3 py-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">{label}</p>
                <p className="mt-1 truncate text-[12px] font-semibold text-[#374151]">{value || sourceUrl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentRun({
  activeStep,
  progress,
  previewUrl,
  sourceUrl,
  sourceHost,
  currentRoute,
}: {
  activeStep: number;
  progress: number;
  previewUrl: string | null;
  sourceUrl: string;
  sourceHost: string;
  currentRoute: TakedownRoute;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fafaf8] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-indigo-400 status-pulse" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9ca3af]">Agent run active</p>
        </div>
        <span className="font-mono text-[11px] font-semibold text-[#0a0a0a]">{progress}%</span>
      </div>

      <div className="relative p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "linear-gradient(#e8e4de 1px, transparent 1px), linear-gradient(90deg, #e8e4de 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="relative aspect-square overflow-hidden border border-[#e8e4de] bg-white p-2 shadow-sm">
              <div className="relative h-full w-full overflow-hidden bg-[#fafaf8]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Evidence under analysis" className="h-full w-full object-cover grayscale" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c4bdb5]">Source evidence</p>
                      <p className="mt-3 break-words text-[13px] leading-6 text-[#6b7280]">{sourceUrl}</p>
                    </div>
                  </div>
                )}
                <div
                  className="absolute inset-0 opacity-[0.14]"
                  style={{
                    background: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                />
                <div className="scan-sweep absolute left-0 right-0 top-0 h-px bg-[#0a0a0a]" />
                <div className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-widest text-[#0a0a0a]/40">NCII route scan</div>
                <div className="absolute bottom-4 right-4 font-mono text-[9px] uppercase tracking-widest text-[#0a0a0a]/40">{sourceHost}</div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="mb-4 h-0.5 w-full bg-[#e8e4de]">
                <div className="h-full bg-[#0a0a0a] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest">
                <span className="text-[#9ca3af]">Agents in progress</span>
                <span className="font-bold text-[#0a0a0a]">{progress}.00%</span>
              </div>
            </div>

            <div className="space-y-6">
              {agentSteps.map((step, index) => {
                const done = index < activeStep;
                const active = index === activeStep;
                return (
                  <div key={step.agent} className="flex items-start gap-5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-all ${
                        done
                          ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                          : active
                            ? "border-[#0a0a0a] bg-white text-[#0a0a0a]"
                            : "border-[#e8e4de] bg-white text-[#d4cfc9]"
                      }`}
                    >
                      {done ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${active ? "text-[#0a0a0a]" : done ? "text-[#6b7280]" : "text-[#c4bdb5]"}`}>
                        {step.label}
                      </p>
                      <p className="mt-1 text-[11.5px] leading-5 text-[#9ca3af]">{active ? step.detail : step.agent}</p>
                      {active && (
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-indigo-500">
                          Checking {currentRoute.domain}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-[#e8e4de] bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9ca3af]">Current route</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-green-600">Secure</span>
              </div>
              <p className="mt-2 font-mono text-[13px] font-semibold text-[#0a0a0a]">{currentRoute.domain}</p>
              <p className="mt-1 text-[12px] text-[#6b7280]">{currentRoute.removalPageUrl || currentRoute.contactEmail || "Manual discovery required"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportView({
  sourceUrl,
  sourceHost,
  previewUrl,
  primaryRoute,
  visibleRoutes,
}: {
  sourceUrl: string;
  sourceHost: string;
  previewUrl: string | null;
  primaryRoute: TakedownRoute;
  visibleRoutes: TakedownRoute[];
}) {
  const route = primaryRoute;
  const requiredFields = routeFields(route).join(", ");

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5">
          {[
            ["Case Ref", caseRef],
            ["Type", "NCII leak"],
            ["Priority", "Immediate"],
            ["Source", sourceHost],
            ["Status", "Ready"],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`px-4 py-4 ${index < 4 ? "border-r border-[#f0ede8]" : ""} ${index >= 2 ? "border-t border-[#f0ede8] sm:border-t-0" : ""}`}
            >
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4bdb5]">{label}</p>
              <p className="truncate text-[13px] font-semibold leading-tight text-[#0a0a0a]">{value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#f0ede8] bg-[#fafaf8] px-4 py-3.5">
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4bdb5]">Case statement</p>
          <p className="text-[12.5px] leading-relaxed text-[#374151]">
            This packet concerns non-consensual intimate imagery linked to {sourceUrl}. Remove the post, cached media, thumbnails, and mirrored copies immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-[#e8e4de] bg-white p-5 shadow-sm">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#a8a29e]">Evidence</p>
          <div className="mb-4 overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fafaf8]">
            {previewUrl ? (
              <img src={previewUrl} alt="Evidence preview" className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-56 items-center justify-center px-6 text-center">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#c4bdb5]">Link-only evidence</p>
                  <p className="mt-3 break-words text-[12px] leading-5 text-[#6b7280]">{sourceUrl}</p>
                </div>
              </div>
            )}
          </div>
          <div className="divide-y divide-[#f0ede8] rounded-lg border border-[#f0ede8] bg-[#fafaf8]">
            {evidenceRows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-[#c4bdb5]">{label}</span>
                <span className="max-w-48 text-right text-[11.5px] leading-5 text-[#374151]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
            <div className="bg-[#0a0a0a] px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Primary route</p>
            </div>
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[15px] font-semibold text-[#0a0a0a]">{route.domain}</p>
                  <p className="mt-1 text-[12px] capitalize text-[#6b7280]">{route.removalType || "unknown"} / {qualityLabel(route)}</p>
                </div>
                <span className="shrink-0 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-rose-600">
                  Urgent
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Route", route.removalPageUrl || route.contactEmail || "Manual discovery required"],
                  ["Required", requiredFields],
                  ["Provider", route.providerType.replace(/_/g, " ") || "unknown"],
                  ["Fallback", route.contactEmail || "Host escalation after 24h"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#f0ede8] bg-[#fafaf8] px-3 py-2.5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">{label}</p>
                    <p className="mt-1 break-words text-[12px] font-semibold text-[#374151]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#f0ede8] bg-[#fafaf8] p-4">
                <p className="mb-2 text-[12px] font-semibold text-[#0a0a0a]">Generated notice</p>
                <p className="text-[12px] leading-6 text-[#374151]">
                  This report concerns non-consensual intimate imagery linked to {sourceUrl}. Please remove the post, cached media, thumbnails, and mirrored copies immediately. The attached packet includes a case reference, source URL, media hash, timestamp, and policy frame.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e8e4de] bg-white p-5 shadow-sm">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#a8a29e]">Actions</p>
            <div className="space-y-3">
              {[
                ["Submit notice", "Open the primary route and paste the generated notice.", "Urgent"],
                ["Attach evidence", "Include case ID and hash in every message.", "Required"],
                ["Escalate after 24h", "Use fallback email or host contact if no response.", "Follow-up"],
              ].map(([label, detail, tone], index) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fafaf8] font-mono text-[10px] text-[#374151]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-[#374151]">{label}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider ${
                          tone === "Urgent"
                            ? "border-rose-100 bg-rose-50 text-rose-600"
                            : tone === "Required"
                              ? "border-amber-100 bg-amber-50 text-amber-700"
                              : "border-[#e8e4de] bg-[#fafaf8] text-[#9ca3af]"
                        }`}
                      >
                        {tone}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-5 text-[#6b7280]">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_112px_90px] border-b border-[#f0ede8] bg-[#fafaf8] px-4 py-3 font-mono text-[9.5px] uppercase tracking-widest text-[#c4bdb5]">
          <span>Route checked</span>
          <span>Method</span>
          <span>Quality</span>
        </div>
        {visibleRoutes.slice(0, 4).map((routeItem) => (
          <div key={routeItem.domain} className="grid grid-cols-[1fr_112px_90px] items-center border-b border-[#f0ede8] px-4 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate font-mono text-[12px] font-semibold text-[#374151]">{routeItem.domain}</p>
              <p className="truncate text-[11px] text-[#9ca3af]">{routeItem.removalPageUrl || routeItem.contactEmail || "No direct route"}</p>
            </div>
            <span className="text-[12px] capitalize text-[#374151]">{routeItem.removalType || "unknown"}</span>
            <span className="font-mono text-[10px] text-[#6b7280]">Q{routeItem.dataQuality}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NewCaseFlow({ routes }: NewCaseFlowProps) {
  const [stage, setStage] = useState<Stage>("submit");
  const [sourceUrl, setSourceUrl] = useState("https://t.me/example-channel/23891");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const visibleRoutes = useMemo(() => routes.slice(0, 6), [routes]);
  const primaryRoute = visibleRoutes[0] ?? {
    domain: "manual-review",
    cdnProvider: "",
    providerType: "unknown",
    removalPageUrl: "",
    removalType: "unknown",
    contactEmail: "",
    lastChecked: "",
    dataQuality: 0,
  };
  const currentRoute = visibleRoutes[Math.min(activeStep, visibleRoutes.length - 1)] ?? primaryRoute;
  const sourceHost = safeHost(sourceUrl);

  useEffect(() => {
    if (stage !== "agents") return;

    const timers = agentSteps.map((_, index) =>
      window.setTimeout(() => {
        setActiveStep(index);
        setProgress(Math.min(92, Math.round(((index + 1) / agentSteps.length) * 92)));
      }, index * 900),
    );
    const done = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => setStage("report"), 350);
    }, agentSteps.length * 900 + 500);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [stage]);

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

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function useMockCase() {
    setSourceUrl("https://t.me/example-channel/23891");
    clearFile();
  }

  function startAgents() {
    setActiveStep(0);
    setProgress(0);
    setStage("agents");
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-[#e8e4de] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
            LeakOps
          </Link>
          <span className="text-[#d4cfc9]">/</span>
          <span className="text-[13px] text-[#9ca3af]">NCII takedown</span>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-[#c4bdb5] sm:inline">
            {routes.length} routes loaded
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600">NCII / urgent takedown</span>
          </div>
          <h1 className="serif-title mb-2 text-3xl leading-snug text-[#0a0a0a]">
            Submit the leak source. Agents prepare the response.
          </h1>
          <p className="max-w-xl text-[14px] leading-7 text-[#6b7280]">
            One focused flow: source evidence, route scan, takedown packet. No extra classification.
          </p>
        </div>

        <WorkflowRail stage={stage} />

        {stage === "submit" && (
          <section className="space-y-6">
            <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-5 shadow-sm">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#a8a29e]">Case source</p>

              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#0a0a0a]">Leak URL</span>
                  <span className="font-mono text-[10px] uppercase text-red-500">Required</span>
                </div>
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  className="w-full rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3 font-mono text-[12px] text-[#374151] outline-none transition-colors focus:border-[#0a0a0a] focus:bg-white"
                />
              </div>

              <UploadBox previewUrl={previewUrl} onFile={handleFile} onClear={clearFile} />
            </div>

            <SourceCard sourceUrl={sourceUrl} sourceHost={sourceHost} routeCount={routes.length} />

            <div className="flex items-center justify-between">
              <button type="button" onClick={useMockCase} className="text-[13px] text-[#6b7280] transition-colors hover:text-[#0a0a0a]">
                Use mock case
              </button>
              <button
                type="button"
                onClick={startAgents}
                disabled={!sourceUrl.trim()}
                className="flex items-center gap-2 rounded-full bg-[#0a0a0a] px-8 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start agent run
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </section>
        )}

        {stage === "agents" && (
          <AgentRun
            activeStep={activeStep}
            progress={progress}
            previewUrl={previewUrl}
            sourceUrl={sourceUrl}
            sourceHost={sourceHost}
            currentRoute={currentRoute}
          />
        )}

        {stage === "report" && (
          <ReportView
            sourceUrl={sourceUrl}
            sourceHost={sourceHost}
            previewUrl={previewUrl}
            primaryRoute={primaryRoute}
            visibleRoutes={visibleRoutes}
          />
        )}
      </main>
    </div>
  );
}
