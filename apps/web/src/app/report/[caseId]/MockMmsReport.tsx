"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type MockMmsReportProps = {
  caseId: string;
  routes: TakedownRoute[];
};

const evidenceHash = "9f4e12...a21c88";

function safeHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "submitted source";
  }
}

function qualityLabel(route: TakedownRoute) {
  if (route.dataQuality >= 3) return "Verified";
  if (route.dataQuality === 2) return "Likely";
  return "Review";
}

function routeFields(route: TakedownRoute) {
  if (route.removalType === "form") return ["content_url", "email", "reason", "description"];
  if (route.removalType === "email") return ["subject", "content_url", "evidence_summary"];
  return ["domain", "evidence_summary", "operator_contact"];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

async function previewToDataUrl(previewUrl: string) {
  if (previewUrl.startsWith("data:")) return previewUrl;

  try {
    const blob = await fetch(previewUrl).then((response) => response.blob());
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">{num}</span>
      <span className="h-px flex-1 bg-[#e8e4de]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">{label}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MockMmsReport({ caseId, routes }: MockMmsReportProps) {
  const [source, setSource] = useState("Telegram");
  const [sourceUrl, setSourceUrl] = useState("https://desileak49.com/watch/leaked-mms-23891");
  const [preview, setPreview] = useState("/mock-evidence.svg");
  const [copied, setCopied] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<"idle" | "preparing" | "opened">("idle");

  const visibleRoutes = useMemo(() => routes.slice(0, 8), [routes]);
  const route = visibleRoutes[0] ?? {
    domain: "desileak49.com",
    cdnProvider: "desileak49.com",
    providerType: "external_cdn",
    removalPageUrl: "https://desileak49.com/html/dmca.php",
    removalType: "email",
    contactEmail: "desileak49@proton.me",
    lastChecked: "demo",
    dataQuality: 3,
  };
  const requiredFields = routeFields(route).join(", ");
  const sourceHost = safeHost(sourceUrl);
  const reportDate = "14 Jun 2026";
  const noticeText = `This report concerns non-consensual intimate imagery linked to ${sourceUrl}. Please remove the post, cached media, thumbnails, and mirrored copies immediately. Case reference: ${caseId}. Evidence hash: ${evidenceHash}.`;
  const subject = `Urgent MMS / NCII removal request - ${caseId}`;
  const emailBody = `${noticeText}\n\nAttachments prepared by LeakOps:\n- ${caseId}-investigation-packet.html\n- Case source: ${sourceUrl}\n- Required fields: ${requiredFields}`;
  const submissionTarget = route.contactEmail ? gmailComposeUrl(route.contactEmail, subject, emailBody) : route.removalPageUrl;

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const savedCase = sessionStorage.getItem("leakops_case");
        const savedPreview = sessionStorage.getItem("leakops_preview");
        if (savedPreview) setPreview(savedPreview);
        if (!savedCase) return;
        const parsed = JSON.parse(savedCase) as { source?: string; sourceUrl?: string };
        if (parsed.source) setSource(parsed.source);
        if (parsed.sourceUrl) setSourceUrl(parsed.sourceUrl);
      } catch {
        // Mock report can render without browser storage.
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard permissions vary by browser.
    }
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function buildPacketHtml() {
    const imageData = await previewToDataUrl(preview);
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
  <title>${caseId} LeakOps MMS Investigation Report</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; line-height: 1.5; }
    h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; margin: 0 0 8px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; margin-top: 28px; color: #777; border-top: 1px solid #e8e4de; padding-top: 18px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    td, th { border: 1px solid #e8e4de; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #fafaf8; text-align: left; text-transform: uppercase; letter-spacing: 0.08em; color: #777; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
    .box { border: 1px solid #e8e4de; background: #fafaf8; padding: 12px; border-radius: 8px; font-size: 12px; }
    .notice { white-space: pre-wrap; border: 1px solid #e8e4de; background: #fafaf8; padding: 16px; border-radius: 8px; }
    img { max-width: 100%; border: 1px solid #e8e4de; border-radius: 10px; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>LeakOps MMS Investigation Report</h1>
  <p>Sniffer-style mock evidence record with agentic takedown execution.</p>
  <div class="meta">
    <div class="box"><strong>Case reference</strong><br />${caseId}</div>
    <div class="box"><strong>Date</strong><br />${reportDate}</div>
    <div class="box"><strong>Source</strong><br />${escapeHtml(sourceUrl)}</div>
    <div class="box"><strong>Primary route</strong><br />${escapeHtml(route.domain)}</div>
    <div class="box"><strong>Required fields</strong><br />${escapeHtml(requiredFields)}</div>
    <div class="box"><strong>Submission method</strong><br />${escapeHtml(route.contactEmail ? "Gmail draft" : "Platform route")}</div>
  </div>
  <h2>Evidence Manifest</h2>
  <table>
    <tbody>
      <tr><th>Case type</th><td>MMS / NCII leak</td></tr>
      <tr><th>Priority</th><td>Immediate</td></tr>
      <tr><th>Source platform</th><td>${escapeHtml(source)}</td></tr>
      <tr><th>Evidence hash</th><td>${evidenceHash}</td></tr>
    </tbody>
  </table>
  ${imageData ? `<h2>Submitted Evidence</h2><img src="${imageData}" alt="Submitted evidence" />` : ""}
  <h2>Routes Checked</h2>
  <table>
    <thead><tr><th>Domain</th><th>Method</th><th>Route</th><th>Quality</th></tr></thead>
    <tbody>${checkedRoutes}</tbody>
  </table>
  <h2>Generated Notice</h2>
  <div class="notice">${escapeHtml(noticeText)}</div>
</body>
</html>`;
  }

  async function downloadPacket() {
    const packet = await buildPacketHtml();
    downloadFile(`${caseId}-investigation-packet.html`, packet, "text/html;charset=utf-8");
  }

  async function submitReport() {
    setSubmissionState("preparing");
    await downloadPacket();
    await copyText("notice", noticeText);
    if (submissionTarget) window.open(submissionTarget, "_blank");
    setSubmissionState("opened");
  }

  const reportMeta = [
    ["Date", reportDate],
    ["Source Platform", source],
    ["Issue Type", "MMS / NCII leak"],
    ["Report Type", "Anonymous"],
  ];

  const legalPoints = [
    ["Privacy", "Information Technology Act, 2000 - Section 66E", "Publishing private imagery without consent can be treated as a privacy violation."],
    ["Online publication", "IT Act - Sections 67 / 67A", "Certain intimate material may require urgent removal and platform escalation."],
    ["Takedown", "Platform abuse and DMCA routes", "The Route Agent checks DMCA, content-removal, abuse, and contact pages."],
    ["Follow-up", "Escalation support", "Escalate to host, registrar, cybercrime portal, or legal support if no response arrives."],
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] print:bg-white">
      <header className="sticky top-0 z-20 border-b border-[#e8e4de]/80 bg-white/90 px-4 py-3.5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md print:hidden sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/" className="font-mono text-[13px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
            LeakOps
          </Link>
          <span className="text-[#d4cfc9]">/</span>
          <span className="font-mono text-[11.5px] uppercase tracking-wider text-[#9ca3af]">MMS Investigation Report</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/leak" className="rounded-lg border border-[#e8e4de] px-3 py-1.5 text-[11px] text-[#6b7280] transition-colors hover:border-[#c4bdb5] hover:text-[#0a0a0a]">
              New case
            </Link>
            <button onClick={() => void downloadPacket()} className="rounded-lg bg-[#0a0a0a] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#1a1a1a]">
              Download
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 pb-16 sm:px-6">
        <section>
          <SectionLabel num="01" label="Case Summary" />
          <div className="overflow-hidden rounded-2xl border border-[#e8e4de]/90 bg-white shadow-[0_2px_24px_-12px_rgba(15,23,42,0.08)]">
            <div className="px-6 py-6 sm:px-7">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-[#9ca3af]">Case Reference</p>
                  <h1 className="text-[26px] font-semibold tracking-tight text-[#0a0a0a] sm:text-[30px]">{caseId}</h1>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6b7280]">
                  MMS / NCII
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {reportMeta.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3.5 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">{label}</p>
                    <p className="mt-1.5 truncate text-[12.5px] font-medium text-[#0a0a0a]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-4">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Complainant Statement</p>
                <p className="break-words text-[13px] leading-relaxed text-[#374151]">
                  Private MMS content appears to have been shared or mirrored without consent at {sourceUrl}. The priority is immediate removal, evidence preservation, and platform escalation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/30 px-6 py-5 shadow-[0_2px_20px_-10px_rgba(5,150,105,0.2)]">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700">
                <CheckIcon />
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-emerald-700">Step 1 - Evidence Recorded</p>
                <p className="mb-1 text-[14px] font-semibold text-emerald-900">Your case has been created anonymously</p>
                <p className="mb-3 text-[12.5px] leading-relaxed text-emerald-800">
                  The mock agents generated a case reference, attached source evidence, and prepared the material for platform correspondence.
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    ["Case Reference", caseId],
                    ["Recorded At", `${reportDate}, 13:05 IST`],
                    ["Pipeline", "MMS Leak Discovery"],
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
          <SectionLabel num="02" label="Submitted Evidence" />
          <div className="overflow-hidden rounded-2xl border border-[#e8e4de]/90 bg-white shadow-[0_2px_24px_-12px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-start sm:gap-7 sm:px-7">
              <div className="shrink-0 rounded-lg border border-[#e8e4de] bg-[#fafaf8] p-3">
                <img src={preview} alt="Submitted evidence" className="h-44 w-44 rounded object-cover sm:h-52 sm:w-52" />
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Image Classification</p>
                  <p className="text-[13px] font-medium text-[#0a0a0a]">Submitted evidence - MMS source media</p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Used For</p>
                  <p className="text-[13px] leading-relaxed text-[#6b7280]">
                    Mock visual hash fingerprinting, distribution trace, route matching, and takedown notice preparation.
                  </p>
                </div>
                <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-3">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#9ca3af]">Integrity Statement</p>
                  <p className="text-[12px] leading-relaxed text-[#6b7280]">
                    Evidence is preserved inside this mock packet. The case reference and hash should be included in every platform report.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Case type", "MMS / NCII leak"],
                    ["Priority", "Immediate"],
                    ["Policy", "Non-consensual intimate imagery"],
                    ["Hash", evidenceHash],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#f0ede8] bg-[#fafaf8] px-3 py-2">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">{label}</p>
                      <p className="mt-1 text-[11.5px] font-medium text-[#374151]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionLabel num="02b" label="Legal Reference" />
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
              <p className="text-[12px] leading-relaxed text-[#6b7280]">High-level orientation for India. This is not legal advice.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
              {legalPoints.map(([tag, title, body]) => (
                <article key={title} className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-4">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#9ca3af]">{tag}</p>
                  <p className="mb-2 text-[12.5px] font-semibold leading-snug text-[#0a0a0a]">{title}</p>
                  <p className="text-[12px] leading-relaxed text-[#6b7280]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionLabel num="03" label="Discovery Findings" />
          <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-[#e8e4de] bg-[#fafaf8] px-5 py-4">
              <div>
                <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4bdb5]">Distribution Trace</p>
                <p className="text-[14px] font-semibold text-[#0a0a0a]">Visual match scan</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#6b7280]">Mock trace across high-risk domains and known mirror networks.</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                3 matches
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 font-mono text-[11px] text-[#6b7280]">
                  6 domains - 47 pages - 312 assets evaluated
                </span>
                <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-mono text-[11px] text-indigo-600">
                  Priority: NCII Mirror Network
                </span>
              </div>
              {visibleRoutes.slice(0, 4).map((item, index) => (
                <article key={item.domain} className="rounded-xl border border-[#e8e4de] bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-[#0a0a0a]">{item.domain}</p>
                        {index === 0 && (
                          <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-rose-600">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="truncate font-mono text-[10.5px] text-[#9ca3af]">{item.removalPageUrl || item.contactEmail || "No direct route"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9.5px] text-emerald-700">
                      {qualityLabel(item)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["Match", index === 0 ? "Exact" : index === 1 ? "Near duplicate" : "Related"],
                      ["Provider", item.providerType.replace(/_/g, " ") || "unknown"],
                      ["Method", item.removalType || "unknown"],
                      ["Quality", `Q${item.dataQuality}`],
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
        </section>

        <section>
          <SectionLabel num="04" label="Removal Actions" />
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
                    {submissionState === "preparing" ? "Preparing..." : submissionState === "opened" ? "Gmail opened" : route.contactEmail ? "Submit in Gmail" : "Open platform route"}
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
            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    ["Domain", route.domain],
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

              <div className="overflow-hidden rounded-xl border border-[#e8e4de]">
                <div className="flex items-center justify-between border-b border-[#f0ede8] bg-[#fafaf8] px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Ready Notice</p>
                  <button
                    type="button"
                    onClick={() => void copyText("notice", noticeText)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6b7280] transition-colors hover:border-[#0a0a0a] hover:text-[#0a0a0a]"
                  >
                    {copied === "notice" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="max-h-64 select-text overflow-auto whitespace-pre-wrap bg-white px-4 py-4 font-mono text-[11px] leading-relaxed text-[#374151]">
                  {noticeText}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
