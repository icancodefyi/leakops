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
type PreviewSource = "source" | "upload" | null;
type ImageFetchState = "idle" | "loading" | "ready" | "failed";

type NewCaseFlowProps = {
  routes: TakedownRoute[];
};

const caseRef = "LO-23891";
const defaultSource = "/mock-evidence.svg";

const workflowSteps: Array<{ id: Stage; step: string; label: string; sub: string }> = [
  { id: "submit", step: "1", label: "Source", sub: "One URL" },
  { id: "agents", step: "2", label: "Agents", sub: "Live run" },
  { id: "report", step: "3", label: "Submit", sub: "Gmail ready" },
];

const agentSteps = [
  {
    agent: "Evidence Agent",
    label: "Fetch and preserve source",
    detail: "Resolves the input URL, fetches the image, stores the source host, and creates the evidence manifest.",
    output: "Evidence image, source URL, timestamp, media hash",
  },
  {
    agent: "Route Agent",
    label: "Check takedown registry",
    detail: "Searches the CSV registry for DMCA pages, content-removal forms, abuse mailboxes, and host fallback routes.",
    output: "Primary removal route and verified fallback",
  },
  {
    agent: "Requirement Agent",
    label: "Read required fields",
    detail: "Classifies whether the route needs a form submission, email notice, or manual escalation.",
    output: "Required fields and submission method",
  },
  {
    agent: "Notice Agent",
    label: "Draft NCII notice",
    detail: "Writes the short removal request with policy framing, case reference, source URL, and evidence hash.",
    output: "Platform-ready complaint text",
  },
  {
    agent: "Submission Agent",
    label: "Prepare the filing packet",
    detail: "Bundles the evidence attachment, copies the notice, and chooses Gmail or the platform route.",
    output: "One-click submission action",
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
  if (value.startsWith("/")) return "local demo source";

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function previewToDataUrl(previewUrl: string | null) {
  if (!previewUrl) return "";

  try {
    const blob = await fetch(previewUrl).then((response) => response.blob());
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read evidence image."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function gmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
                className={`mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
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

function EvidencePreview({
  previewUrl,
  previewSource,
  fetchState,
  fetchMessage,
  onFile,
  onClear,
}: {
  previewUrl: string | null;
  previewSource: PreviewSource;
  fetchState: ImageFetchState;
  fetchMessage: string;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fafaf8]">
      <div className="grid grid-cols-1 sm:grid-cols-[210px_1fr]">
        <div className="relative aspect-[4/3] border-b border-[#e8e4de] bg-white sm:border-b-0 sm:border-r">
          {previewUrl ? (
            <img src={previewUrl} alt="Evidence preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                {fetchState === "loading" ? (
                  <span className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-[#e8e4de] border-t-[#0a0a0a]" />
                ) : (
                  <svg width="22" height="22" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 15 4-4 4 4 3-3 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#c4bdb5]">
                  {fetchState === "loading" ? "Fetching image" : "Evidence preview"}
                </p>
              </div>
            </div>
          )}
          {previewUrl && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[#374151] shadow-sm">
              {previewSource === "source" ? "Fetched" : "Uploaded"}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Evidence image</p>
              <p className="mt-1 text-[13px] font-semibold text-[#0a0a0a]">
                {previewUrl ? "Attached to case file" : "Fetched automatically from the URL"}
              </p>
            </div>
            {previewUrl && (
              <button type="button" onClick={onClear} className="text-[12px] text-[#9ca3af] transition-colors hover:text-red-600">
                Remove
              </button>
            )}
          </div>
          <p className="mb-4 text-[12.5px] leading-6 text-[#6b7280]">{fetchMessage}</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e8e4de] bg-white px-3 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Upload fallback
          </label>
        </div>
      </div>
    </div>
  );
}

function AgentPromise({ routeCount, sourceHost }: { routeCount: number; sourceHost: string }) {
  const items = [
    ["Evidence", `Preserve source from ${sourceHost}`],
    ["Routes", `Scan ${routeCount} takedown routes`],
    ["Notice", "Generate NCII removal text"],
    ["Submit", "Open Gmail with packet ready"],
  ];

  return (
    <div className="rounded-xl border border-[#f0ede8] bg-[#fafaf8] px-5 py-4">
      <div className="flex items-start gap-3">
        <svg width="14" height="14" fill="none" stroke="#a8a29e" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-[12px] font-semibold text-[#374151]">What the agents will do</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            {items.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#e8e4de] bg-white px-3 py-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">{label}</p>
                <p className="mt-1 text-[11.5px] leading-5 text-[#374151]">{value}</p>
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
  routeCount,
}: {
  activeStep: number;
  progress: number;
  previewUrl: string | null;
  sourceUrl: string;
  sourceHost: string;
  currentRoute: TakedownRoute;
  routeCount: number;
}) {
  const activeAgent = agentSteps[Math.min(activeStep, agentSteps.length - 1)];
  const liveLines = [
    `source.host = ${sourceHost}`,
    `routes.loaded = ${routeCount}`,
    `current.route = ${currentRoute.domain}`,
    `agent.output = ${activeAgent.output}`,
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-rose-500 status-pulse" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-600">Agent run active</p>
            <p className="mt-0.5 text-[12px] text-[#9ca3af]">LeakOps is preparing the takedown response.</p>
          </div>
        </div>
        <span className="font-mono text-[12px] font-bold text-[#0a0a0a]">{progress}%</span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="mb-7 h-1 rounded-full bg-[#f0ede8]">
          <div className="h-full rounded-full bg-[#0a0a0a] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="relative overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                {previewUrl ? (
                  <img src={previewUrl} alt="Evidence under analysis" className="h-full w-full object-cover grayscale" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <p className="break-words text-[13px] leading-6 text-[#6b7280]">{sourceUrl}</p>
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.18]"
                  style={{
                    background: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <div className="scan-sweep absolute left-0 right-0 top-0 h-px bg-[#0a0a0a]" />
                <div className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[#0a0a0a]/50">
                  Source evidence
                </div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[#0a0a0a]/50">
                  {sourceHost}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Now running</p>
              <h2 className="serif-title mt-2 text-2xl leading-tight text-[#0a0a0a]">{activeAgent.label}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#6b7280]">{activeAgent.detail}</p>
            </div>

            <div className="space-y-4">
              {agentSteps.map((step, index) => {
                const done = index < activeStep;
                const active = index === activeStep;
                return (
                  <div key={step.agent} className="flex items-start gap-4">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-all ${
                        done
                          ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                          : active
                            ? "border-rose-300 bg-rose-50 text-rose-600"
                            : "border-[#e8e4de] bg-white text-[#c4bdb5]"
                      }`}
                    >
                      {done ? <CheckIcon /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-[13px] font-semibold ${active ? "text-[#0a0a0a]" : done ? "text-[#374151]" : "text-[#c4bdb5]"}`}>
                          {step.agent}
                        </p>
                        {active && (
                          <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-rose-600">
                            Working
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-5 text-[#9ca3af]">{done ? step.output : step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-[#e8e4de] bg-[#0a0a0a] p-4 text-white">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">Live agent log</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">Streaming</span>
              </div>
              <div className="space-y-1.5">
                {liveLines.map((line) => (
                  <p key={line} className="break-words font-mono text-[11px] leading-5 text-white/75">
                    <span className="text-white/35">&gt;</span> {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportSection({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">{num}</span>
      <span className="h-px flex-1 bg-[#e8e4de]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">{label}</span>
    </div>
  );
}

function ReportView({
  sourceUrl,
  sourceHost,
  previewUrl,
  primaryRoute,
  visibleRoutes,
  copiedAction,
  onCopy,
}: {
  sourceUrl: string;
  sourceHost: string;
  previewUrl: string | null;
  primaryRoute: TakedownRoute;
  visibleRoutes: TakedownRoute[];
  copiedAction: string | null;
  onCopy: (action: string, value: string) => void;
}) {
  const [submissionState, setSubmissionState] = useState<"idle" | "preparing" | "submitted">("idle");
  const route = primaryRoute;
  const requiredFields = routeFields(route).join(", ");
  const routeTarget = route.removalPageUrl || route.contactEmail || "";
  const noticeText = `This report concerns non-consensual intimate imagery linked to ${sourceUrl}. Please remove the post, cached media, thumbnails, and mirrored copies immediately. Case reference: ${caseRef}. Evidence hash: 9f4e12...a21c88.`;
  const subject = `Urgent NCII removal request - ${caseRef}`;
  const emailBody = `${noticeText}\n\nAttachments prepared by LeakOps:\n- ${caseRef}-attachment-packet.html\n- Case source: ${sourceUrl}\n- Required fields: ${requiredFields}`;
  const submissionTarget = route.contactEmail
    ? gmailComposeUrl(route.contactEmail, subject, emailBody)
    : route.removalPageUrl;
  const submissionLabel = route.contactEmail ? "Submit in Gmail" : "Open platform route";
  const reportDate = "14 Jun 2026";
  const routeSummary = `${visibleRoutes.length} routes checked from CSV registry`;
  const reportMeta = [
    { label: "Date", value: reportDate },
    { label: "Source Platform", value: sourceHost },
    { label: "Issue Type", value: "NCII leak" },
    { label: "Report Type", value: "Anonymous" },
  ];
  const timelineItems = [
    { label: "Case opened", value: `${reportDate}, 13:05 IST` },
    { label: "Case reference", value: caseRef },
    { label: "Investigation type", value: "NCII Leak Discovery - Agent Run" },
  ];
  const legalPoints = [
    {
      title: "Information Technology Act, 2000 - Section 66E",
      body: "Publishing or transmitting private images without consent can be a punishable privacy violation. Use the case reference and hash when filing.",
      tag: "Privacy",
    },
    {
      title: "IT Act - Sections 67 / 67A",
      body: "Intimate content published without consent may require urgent removal under platform policy and applicable intermediary obligations.",
      tag: "Online publication",
    },
    {
      title: "Platform abuse and DMCA routes",
      body: "The Route Agent checked DMCA, content removal, abuse email, and platform contact routes before selecting the primary method.",
      tag: "Takedown",
    },
    {
      title: "Escalation support",
      body: "If there is no response within 24 to 48 hours, escalate to the host, registrar, platform trust team, or cybercrime portal where relevant.",
      tag: "Follow-up",
    },
  ];

  async function buildPacketHtml() {
    const imageData = await previewToDataUrl(previewUrl);
    const checkedRoutes = visibleRoutes
      .slice(0, 6)
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.domain)}</td>
            <td>${escapeHtml(item.removalType || "unknown")}</td>
            <td>${escapeHtml(item.removalPageUrl || item.contactEmail || "No direct route")}</td>
            <td>Q${item.dataQuality}</td>
          </tr>
        `,
      )
      .join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${caseRef} LeakOps Investigation Report</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; line-height: 1.5; background: #fff; }
    h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; margin: 0 0 8px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; margin-top: 28px; color: #777; border-top: 1px solid #e8e4de; padding-top: 18px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    td, th { border: 1px solid #e8e4de; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #fafaf8; text-align: left; text-transform: uppercase; letter-spacing: 0.08em; color: #777; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
    .box { border: 1px solid #e8e4de; background: #fafaf8; padding: 12px; border-radius: 8px; font-size: 12px; }
    .console { background: #0a0a0a; color: #fff; border-radius: 10px; padding: 16px; margin-top: 12px; }
    .notice { white-space: pre-wrap; border: 1px solid #e8e4de; background: #fafaf8; padding: 16px; border-radius: 8px; }
    img { max-width: 100%; border: 1px solid #e8e4de; border-radius: 10px; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>LeakOps NCII Investigation Report</h1>
  <p>Sniffer-style evidence record with agentic takedown execution.</p>
  <div class="meta">
    <div class="box"><strong>Case reference</strong><br />${caseRef}</div>
    <div class="box"><strong>Date</strong><br />${reportDate}</div>
    <div class="box"><strong>Source</strong><br />${escapeHtml(sourceUrl)}</div>
    <div class="box"><strong>Primary route</strong><br />${escapeHtml(route.domain)}</div>
    <div class="box"><strong>Required fields</strong><br />${escapeHtml(requiredFields)}</div>
    <div class="box"><strong>Submission method</strong><br />${escapeHtml(route.contactEmail ? "Gmail draft" : "Platform route")}</div>
  </div>

  <h2>Evidence Manifest</h2>
  <table>
    <tbody>
      <tr><th>Case type</th><td>NCII leak</td></tr>
      <tr><th>Priority</th><td>Immediate</td></tr>
      <tr><th>Policy</th><td>Non-consensual intimate imagery</td></tr>
      <tr><th>Evidence hash</th><td>9f4e12...a21c88</td></tr>
      <tr><th>Source host</th><td>${escapeHtml(sourceHost)}</td></tr>
    </tbody>
  </table>
  ${imageData ? `<h2>Fetched Evidence Image</h2><img src="${imageData}" alt="Fetched evidence" />` : ""}

  <h2>Discovery Findings</h2>
  <table>
    <thead><tr><th>Domain</th><th>Method</th><th>Route</th><th>Quality</th></tr></thead>
    <tbody>${checkedRoutes}</tbody>
  </table>

  <h2>Removal Console</h2>
  <div class="console">
    <p><strong>Primary target:</strong> ${escapeHtml(route.domain)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(route.contactEmail || "Use platform route")}</p>
    <p><strong>Route:</strong> ${escapeHtml(route.removalPageUrl || "Manual discovery required")}</p>
  </div>

  <h2>Generated Notice</h2>
  <div class="notice">${escapeHtml(noticeText)}</div>
</body>
</html>`;
  }

  async function downloadPacket() {
    const packet = await buildPacketHtml();
    downloadFile(`${caseRef}-attachment-packet.html`, packet, "text/html;charset=utf-8");
  }

  async function submitReport() {
    setSubmissionState("preparing");
    const openedWindow = !route.contactEmail && route.removalPageUrl ? window.open("about:blank", "_blank") : null;

    await downloadPacket();
    onCopy("notice", noticeText);

    if (route.contactEmail) {
      window.open(submissionTarget, "_blank");
    } else if (openedWindow && route.removalPageUrl) {
      openedWindow.location.href = route.removalPageUrl;
    } else if (route.removalPageUrl) {
      window.open(route.removalPageUrl, "_blank");
    }

    setSubmissionState("submitted");
  }

  return (
    <section className="space-y-10">
      <section>
        <ReportSection num="01" label="Case Summary" />
        <div className="overflow-hidden rounded-2xl border border-[#e8e4de]/90 bg-white shadow-[0_2px_24px_-12px_rgba(15,23,42,0.08)]">
          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-[#9ca3af]">Case Reference</p>
                <h2 className="text-[26px] font-semibold tracking-tight text-[#0a0a0a] sm:text-[30px]">{caseRef}</h2>
              </div>
              <span className="inline-flex items-center rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6b7280]">
                NCII
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {reportMeta.map((item) => (
                <div key={item.label} className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3.5 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">{item.label}</p>
                  <p className="mt-1.5 truncate text-[12.5px] font-medium text-[#0a0a0a]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Complainant Statement</p>
              <p className="break-words text-[13px] leading-relaxed text-[#374151]">
                Private intimate media appears to have been published or mirrored without consent at {sourceUrl}. The priority is immediate removal, evidence preservation, and escalation if the platform does not respond.
              </p>
            </div>

            <div className="mt-5 border-t border-[#e8e4de] pt-5">
              <div className="flex flex-wrap gap-3">
                {timelineItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#9ca3af]">{item.label}:</span>
                    <span className="font-mono text-[11px] text-[#6b7280]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/30 px-6 py-5 shadow-[0_2px_20px_-10px_rgba(5,150,105,0.2)]">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100">
              <CheckIcon />
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-emerald-700">Step 1 - Evidence Recorded</p>
              <p className="mb-1 text-[14px] font-semibold text-emerald-900">Your case has been created anonymously</p>
              <p className="mb-3 text-[12.5px] leading-relaxed text-emerald-800">
                The Evidence Agent fetched the source image, assigned a case reference, and prepared the material for takedown correspondence.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  ["Case Reference", caseRef],
                  ["Recorded At", `${reportDate}, 13:05 IST`],
                  ["Pipeline", "NCII Leak Discovery"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-600">{label}</p>
                    <p className="font-mono text-[13px] font-semibold text-emerald-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <ReportSection num="02" label="Submitted Evidence" />
        <div className="overflow-hidden rounded-2xl border border-[#e8e4de]/90 bg-white shadow-[0_2px_24px_-12px_rgba(15,23,42,0.06)]">
          <div className="px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
              <div className="shrink-0 rounded-lg border border-[#e8e4de] bg-[#fafaf8] p-3">
                {previewUrl ? (
                  <img src={previewUrl} alt="Submitted evidence" className="h-44 w-44 rounded object-cover sm:h-52 sm:w-52" />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded bg-white px-4 text-center sm:h-52 sm:w-52">
                    <p className="break-words font-mono text-[10px] leading-5 text-[#9ca3af]">{sourceUrl}</p>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Image Classification</p>
                  <p className="text-[13px] font-medium text-[#0a0a0a]">Submitted evidence - fetched source media</p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Used For</p>
                  <p className="break-words text-[13px] leading-relaxed text-[#6b7280]">
                    Source URL preservation, evidence hash generation, route matching, and notice preparation.
                  </p>
                </div>
                <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-3">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Integrity Statement</p>
                  <p className="text-[12px] leading-relaxed text-[#6b7280]">
                    Image was fetched from the submitted source and attached to this case packet. The generated evidence hash is used in platform correspondence.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {evidenceRows.map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#f0ede8] bg-[#fafaf8] px-3 py-2">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">{label}</p>
                      <p className="mt-1 text-[11.5px] font-medium text-[#374151]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <ReportSection num="02b" label="Legal Reference" />
        <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 bg-[#0a0a0a] px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Legal console</p>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-white/30">{legalPoints.length} references</span>
          </div>
          <div className="border-b border-[#f0ede8] px-6 py-4">
            <p className="mb-0.5 text-[13px] font-semibold text-[#0a0a0a]">Laws and remedies that may apply</p>
            <p className="text-[12px] leading-relaxed text-[#6b7280]">
              High-level orientation for India. Use this section with platform abuse teams, legal aid, police, or support workers.
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-3">
              <p className="text-[12px] leading-relaxed text-[#374151]">
                <span className="font-semibold text-[#0a0a0a]">Not legal advice.</span> Applicable law depends on facts, age, and jurisdiction. This report is an investigation aid.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {legalPoints.map((item) => (
                <article key={item.title} className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-4 transition-colors hover:border-[#d4cfc9]">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#9ca3af]">{item.tag}</p>
                  <p className="mb-2 text-[12.5px] font-semibold leading-snug text-[#0a0a0a]">{item.title}</p>
                  <p className="text-[12px] leading-relaxed text-[#6b7280]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <ReportSection num="03" label="Discovery Findings" />
        <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#e8e4de] bg-[#fafaf8] px-5 py-4">
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4bdb5]">Distribution Trace</p>
              <p className="text-[14px] font-semibold text-[#0a0a0a]">Route registry scan</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-[#6b7280]">
                Agentic scan across known DMCA, content removal, abuse email, and platform contact surfaces.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {visibleRoutes.length} targets
            </span>
          </div>

          <div className="space-y-6 px-5 py-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 font-mono text-[11px] text-[#6b7280]">
                {routeSummary}
              </span>
              <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-mono text-[11px] text-indigo-600">
                Priority: NCII removal
              </span>
              <span className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 font-mono text-[11px] text-rose-600">
                Primary: {route.domain}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {visibleRoutes.slice(0, 4).map((routeItem, index) => (
                <article key={routeItem.domain} className="rounded-xl border border-[#e8e4de] bg-white p-4 transition-colors hover:border-[#d4cfc9]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-[#0a0a0a]">{routeItem.domain}</p>
                        {index === 0 && (
                          <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-rose-600">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="truncate font-mono text-[10.5px] text-[#9ca3af]">{routeItem.removalPageUrl || routeItem.contactEmail || "No direct route"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9.5px] text-emerald-700">
                      {qualityLabel(routeItem)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["Type", routeItem.removalType || "unknown"],
                      ["Provider", routeItem.providerType.replace(/_/g, " ") || "unknown"],
                      ["Contact", routeItem.contactEmail || "not listed"],
                      ["Quality", `Q${routeItem.dataQuality}`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-[#f0ede8] bg-[#fafaf8] px-3 py-2">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">{label}</p>
                        <p className="mt-1 truncate text-[11.5px] font-medium text-[#374151]">{value}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <ReportSection num="04" label="Removal Actions" />
        <div className="mb-6 overflow-hidden rounded-xl border border-[#e8e4de] bg-white">
          <div className="border-b border-[#e8e4de] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Bulk Takedown</p>
                <h2 className="text-[17px] font-semibold tracking-tight text-[#0a0a0a]">Escalate the primary platform now</h2>
                <p className="mt-1 max-w-lg text-[12.5px] leading-relaxed text-[#6b7280]">
                  Generate one case-wide removal packet and file it through the strongest discovered route.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:shrink-0 sm:items-end">
                <button
                  type="button"
                  onClick={() => void submitReport()}
                  disabled={submissionState === "preparing" || !submissionTarget}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-wait disabled:opacity-50"
                >
                  {submissionState === "preparing" ? "Preparing..." : submissionState === "submitted" ? "Gmail opened" : submissionLabel}
                  {submissionState === "idle" && <ArrowIcon />}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadPacket()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:bg-white"
                >
                  Download packet
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 bg-[#0a0a0a] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-rose-400 status-pulse" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Removal Console</p>
            </div>
            <span className="font-mono text-[10px] text-white/30">{visibleRoutes.length} targets</span>
          </div>

          <div className="border-b border-[#f0ede8] px-6 py-4">
            <p className="mb-0.5 text-[13px] font-semibold text-[#0a0a0a]">Actionable investigation targets</p>
            <p className="text-[12px] leading-relaxed text-[#6b7280]">
              Investigate the infrastructure or issue a takedown notice directly from the case report.
            </p>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleRoutes.slice(0, 4).map((routeItem, index) => (
                <article
                  key={routeItem.domain}
                  className={`rounded-xl border p-4 transition-all ${
                    index === 0 ? "border-[#0a0a0a] bg-white shadow-sm ring-1 ring-[#0a0a0a]/5" : "border-[#e8e4de] bg-[#fafaf8] hover:border-[#d4cfc9]"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-[#0a0a0a]">{routeItem.domain}</p>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[9.5px] text-rose-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {index === 0 ? "Notice Ready" : "Investigated"}
                    </span>
                  </div>
                  <div className="mb-3 space-y-1.5">
                    {[
                      ["Type", index === 0 ? "Direct match" : "Related route"],
                      ["Network", routeItem.cdnProvider || routeItem.providerType.replace(/_/g, " ") || "Unknown"],
                      ["Method", routeItem.removalType || "unknown"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-[10px] text-[#9ca3af]">{label}</span>
                        <span className="truncate font-mono text-[11px] text-[#374151]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-[#f0ede8] pt-2">
                    {routeItem.removalPageUrl && (
                      <a
                        href={routeItem.removalPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 text-[11px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                      >
                        Investigate
                      </a>
                    )}
                    {index === 0 && (
                      <button
                        type="button"
                        onClick={() => void submitReport()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        Takedown
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#f0ede8] bg-[#fafaf8] px-5 py-4">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Investigation Workspace</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-[#0a0a0a]">{route.domain}</p>
                    <span className="rounded-md bg-[#f0ede8] px-2 py-0.5 font-mono text-[10px] text-[#9ca3af]">Case {caseRef}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void submitReport()}
                  disabled={submissionState === "preparing" || !submissionTarget}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  Issue Takedown
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-[#e8e4de] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Infrastructure Intelligence</p>
                  {[
                    ["CDN Provider", route.cdnProvider || "Unknown"],
                    ["Provider Type", route.providerType.replace(/_/g, " ") || "Unknown"],
                    ["Source Host", sourceHost],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] text-[#9ca3af]">{label}</p>
                      <p className="break-words text-[13px] font-medium text-[#0a0a0a]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-xl border border-[#e8e4de] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Takedown Route</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9.5px] text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Verified
                    </span>
                  </div>
                  {[
                    ["Method", route.removalType.replace(/_/g, " ") || "unknown"],
                    ["Contact", route.contactEmail || "Use platform form"],
                    ["Required", requiredFields],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] text-[#9ca3af]">{label}</p>
                      <p className="break-all text-[13px] font-medium text-[#0a0a0a]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e8e4de]">
              <div className="flex items-center justify-between border-b border-[#f0ede8] bg-[#fafaf8] px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Ready Notice</p>
                <button
                  type="button"
                  onClick={() => onCopy("notice", noticeText)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6b7280] transition-colors hover:border-[#0a0a0a] hover:text-[#0a0a0a]"
                >
                  {copiedAction === "notice" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-64 select-text overflow-auto whitespace-pre-wrap bg-white px-4 py-4 font-mono text-[11px] leading-relaxed text-[#374151]">
                {noticeText}
              </pre>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["Submit in Gmail", "Packet downloads and notice is copied.", "Now"],
                ["Attach packet", `${caseRef}-attachment-packet.html`, "Required"],
                ["Escalate after 24h", "Use fallback contact if no response.", "Follow-up"],
              ].map(([label, detail, tone], index) => (
                <div key={label} className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-4">
                  <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white font-mono text-[10px] font-bold text-[#374151]">
                    {index + 1}
                  </span>
                  <span className="mb-2 inline-flex rounded-full border border-[#e8e4de] bg-white px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-[#6b7280]">
                    {tone}
                  </span>
                  <p className="text-[12.5px] font-semibold text-[#374151]">{label}</p>
                  <p className="mt-0.5 text-[11.5px] leading-5 text-[#6b7280]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#e8e4de] pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#9ca3af]">LeakOps - Impic Labs - 2026</p>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#b3aaa1]">
              This report is generated automatically as an investigation aid. It is not legal advice and should be paired with platform, legal, or support-team guidance where needed.
            </p>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => window.print()} className="text-[12px] text-[#6b7280] transition-colors hover:text-[#0a0a0a]">
              Print Report
            </button>
            <button
              type="button"
              disabled={!routeTarget}
              onClick={() => onCopy("route", routeTarget)}
              className="text-[12px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copiedAction === "route" ? "Route copied" : "Copy route"}
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}

export function NewCaseFlow({ routes }: NewCaseFlowProps) {
  const [stage, setStage] = useState<Stage>("submit");
  const [sourceUrl, setSourceUrl] = useState(defaultSource);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource>(null);
  const [imageFetchState, setImageFetchState] = useState<ImageFetchState>("idle");
  const [imageFetchMessage, setImageFetchMessage] = useState("Paste a source URL and LeakOps will fetch the image automatically. Upload is only a fallback.");
  const [lastFetchedSource, setLastFetchedSource] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

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
        setProgress(Math.min(94, Math.round(((index + 1) / agentSteps.length) * 94)));
      }, index * 900),
    );
    const done = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => setStage("report"), 450);
    }, agentSteps.length * 900 + 600);

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

  function setEvidencePreview(nextUrl: string, source: PreviewSource) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextUrl);
    setPreviewSource(source);
  }

  async function fetchSourceImage() {
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
      setImageFetchState("failed");
      setImageFetchMessage("Add a source URL before fetching evidence.");
      return false;
    }

    setImageFetchState("loading");
    setImageFetchMessage("Evidence Agent is fetching the image from the input source...");

    try {
      const response = await fetch(`/api/source-image?url=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Source image could not be fetched.");
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("Fetched source did not return an image.");
      }

      const objectUrl = URL.createObjectURL(blob);
      setEvidencePreview(objectUrl, "source");
      setLastFetchedSource(trimmed);
      setImageFetchState("ready");
      setImageFetchMessage("Image fetched from the input source and attached to the case file.");
      return true;
    } catch (error) {
      setImageFetchState("failed");
      setImageFetchMessage(error instanceof Error ? error.message : "Could not fetch image from source.");
      return false;
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setEvidencePreview(URL.createObjectURL(file), "upload");
    setImageFetchState("ready");
    setImageFetchMessage("Using uploaded fallback image as the evidence attachment.");
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewSource(null);
    setLastFetchedSource("");
    setImageFetchState("idle");
    setImageFetchMessage("Paste a source URL and LeakOps will fetch the image automatically. Upload is only a fallback.");
  }

  function useMockCase() {
    setSourceUrl(defaultSource);
    clearFile();
  }

  async function startAgents() {
    setActiveStep(0);
    setProgress(0);
    setCopiedAction(null);
    if (lastFetchedSource !== sourceUrl.trim() || previewSource !== "source") {
      await fetchSourceImage();
    }
    setStage("agents");
  }

  async function copyText(action: string, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Clipboard permissions vary by browser; the demo should keep moving.
    }
    setCopiedAction(action);
    window.setTimeout(() => setCopiedAction(null), 1800);
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-[#e8e4de] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
            LeakOps
          </Link>
          <span className="text-[#d4cfc9]">/</span>
          <span className="text-[13px] text-[#9ca3af]">Takedown command</span>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-[#c4bdb5] sm:inline">
            {routes.length} routes loaded
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-rose-500">Agentic NCII response</p>
          <h1 className="serif-title mx-auto mb-3 max-w-2xl text-4xl leading-snug text-[#0a0a0a]">
            Paste the leak source. Agents file the takedown.
          </h1>
          <p className="mx-auto max-w-xl text-[14px] leading-7 text-[#6b7280]">
            LeakOps turns one source URL into evidence, route intelligence, a removal notice, and a Gmail-ready submission packet.
          </p>
        </div>

        <WorkflowRail stage={stage} />

        {stage === "submit" && (
          <section className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#e8e4de] bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-[#f0ede8] px-5 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">Case file</p>
                  <p className="mt-1 font-mono text-[13px] font-semibold text-[#0a0a0a]">{caseRef}</p>
                </div>
                <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-rose-600">
                  Immediate
                </span>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#0a0a0a]">Leak source URL</span>
                    <span className="font-mono text-[10px] uppercase text-red-500">Required</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={sourceUrl}
                      onChange={(event) => {
                        setSourceUrl(event.target.value);
                        if (previewSource === "source") {
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                          setPreviewSource(null);
                          setLastFetchedSource("");
                        }
                        setImageFetchState("idle");
                        setImageFetchMessage("Paste a source URL and LeakOps will fetch the image automatically. Upload is only a fallback.");
                      }}
                      onBlur={() => {
                        if (sourceUrl.trim() && lastFetchedSource !== sourceUrl.trim()) void fetchSourceImage();
                      }}
                      className="w-full rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3 font-mono text-[12px] text-[#374151] outline-none transition-colors focus:border-[#0a0a0a] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => void fetchSourceImage()}
                      disabled={imageFetchState === "loading" || !sourceUrl.trim()}
                      className="rounded-xl border border-[#e8e4de] bg-white px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#6b7280] transition-colors hover:border-[#0a0a0a] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {imageFetchState === "loading" ? "Fetching" : "Fetch image"}
                    </button>
                  </div>
                </div>

                <EvidencePreview
                  previewUrl={previewUrl}
                  previewSource={previewSource}
                  fetchState={imageFetchState}
                  fetchMessage={imageFetchMessage}
                  onFile={handleFile}
                  onClear={clearFile}
                />
              </div>
            </div>

            <AgentPromise routeCount={routes.length} sourceHost={sourceHost} />

            <div className="flex items-center justify-between gap-4">
              <button type="button" onClick={useMockCase} className="text-[13px] text-[#6b7280] transition-colors hover:text-[#0a0a0a]">
                Reset demo source
              </button>
              <button
                type="button"
                onClick={startAgents}
                disabled={!sourceUrl.trim() || imageFetchState === "loading"}
                className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-8 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {imageFetchState === "loading" ? "Fetching image" : "Run takedown agents"}
                <ArrowIcon />
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
            routeCount={routes.length}
          />
        )}

        {stage === "report" && (
          <ReportView
            sourceUrl={sourceUrl}
            sourceHost={sourceHost}
            previewUrl={previewUrl}
            primaryRoute={primaryRoute}
            visibleRoutes={visibleRoutes}
            copiedAction={copiedAction}
            onCopy={copyText}
          />
        )}
      </main>
    </div>
  );
}
