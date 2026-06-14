"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DropZone } from "@/components/DropZone";

const SCAN_STEPS = [
  "Evidence Agent fingerprinting image",
  "Discovery Agent scanning monitored MMS domains",
  "Route Agent checking DMCA, abuse, and removal surfaces",
  "Notice Agent preparing platform-ready complaint",
  "Submission Agent compiling packet and Gmail handoff",
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function LeakUploadContent() {
  const router = useRouter();
  const params = useSearchParams();
  const caseId = params.get("caseId") || "LO-23891";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("Telegram");
  const [sourceUrl, setSourceUrl] = useState("https://desileak49.com/watch/leaked-mms-23891");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem("leakops_case");
        if (!saved) return;
        const parsed = JSON.parse(saved) as { source?: string; sourceUrl?: string };
        if (parsed.source) setSourceLabel(parsed.source);
        if (parsed.sourceUrl) setSourceUrl(parsed.sourceUrl);
      } catch {
        // Mock flow can continue without saved metadata.
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  async function handleFile(nextFile: File) {
    if (!nextFile.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setFile(nextFile);
    const dataUrl = await fileToDataUrl(nextFile);
    setPreview(dataUrl);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
  }

  function useDemoImage() {
    setFile(new File(["demo"], "mock-evidence.svg", { type: "image/svg+xml" }));
    setPreview("/mock-evidence.svg");
    setError(null);
  }

  async function startScan() {
    setError(null);
    setScanning(true);
    setProcessing(false);
    setScanStep(0);

    const storedPreview = preview || "/mock-evidence.svg";
    try {
      sessionStorage.setItem("leakops_preview", storedPreview);
      sessionStorage.setItem(
        "leakops_case",
        JSON.stringify({
          caseId,
          source: sourceLabel,
          sourceUrl,
          issueType: "MMS / NCII leak",
          createdAt: Date.now(),
        }),
      );
    } catch {
      // Non-critical for demo.
    }

    const interval = window.setInterval(() => {
      setScanStep((current) => {
        if (current >= SCAN_STEPS.length - 1) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 900);

    await new Promise<void>((resolve) => window.setTimeout(resolve, 4700));
    window.clearInterval(interval);
    setScanStep(SCAN_STEPS.length - 1);
    setScanning(false);
    setProcessing(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 1100));
    router.push(`/report/${caseId}`);
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="flex items-center gap-3 border-b border-[#e8e4de] bg-white px-6 py-4">
        <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
          LeakOps
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/leak" className="text-[13px] text-[#9ca3af] transition-colors hover:text-[#0a0a0a]">
          MMS investigation
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="font-mono text-[12px] text-[#9ca3af]">{caseId}</span>
      </header>

      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf8]/90 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-sm rounded-2xl border border-[#e8e4de] bg-white px-8 py-10 text-center shadow-xl">
            <div className="relative mx-auto mb-6 h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-rose-100 opacity-60" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-200 bg-rose-50">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                  <path d="M2 12h4M18 12h4M12 2v4M12 18v4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-rose-500">Agentic MMS scan</p>
            <p className="mb-1 text-[18px] font-semibold leading-snug text-[#0a0a0a]">Scanning the network</p>
            <p className="mb-7 text-[12.5px] leading-relaxed text-[#6b7280]">
              Mock agents are tracing the evidence across supported domains and compiling routes.
            </p>
            <div className="space-y-2.5 text-left">
              {SCAN_STEPS.map((label, index) => (
                <div key={label} className={`flex items-center gap-2.5 transition-opacity ${index > scanStep ? "opacity-30" : "opacity-100"}`}>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      index < scanStep ? "border-rose-500 bg-rose-500" : index === scanStep ? "border-rose-400 bg-rose-50" : "border-[#e8e4de]"
                    }`}
                  >
                    {index < scanStep && (
                      <svg width="7" height="7" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {index === scanStep && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
                  </div>
                  <span className={`text-[12px] ${index === scanStep ? "font-medium text-[#0a0a0a]" : "text-[#6b7280]"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf8]/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-[#e8e4de] border-t-[#0a0a0a]" />
            <p className="font-mono text-[13px] text-[#9ca3af]">Preparing your Sniffer-style report...</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600">Pipeline - MMS Leak Discovery</span>
        </div>

        <h1 className="serif-title mb-2 text-3xl leading-snug text-[#0a0a0a]">Upload the image to trace</h1>
        <p className="mb-8 max-w-prose text-sm leading-7 text-[#6b7280]">
          We will generate a mock perceptual fingerprint and scan supported domains for visual matches, removal contacts, and escalation paths.
        </p>

        <div className="mb-6 rounded-xl border border-[#e8e4de] bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-[#a8a29e]">Case context</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#f0ede8] bg-[#fafaf8] px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">Source</p>
              <p className="mt-1 truncate text-[12px] font-semibold text-[#374151]">{sourceLabel}</p>
            </div>
            <div className="rounded-lg border border-[#f0ede8] bg-[#fafaf8] px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#c4bdb5]">URL</p>
              <p className="mt-1 truncate text-[12px] font-semibold text-[#374151]">{sourceUrl}</p>
            </div>
          </div>
        </div>

        <DropZone file={file} preview={preview} onFile={handleFile} onClear={clearFile} />

        {!file && (
          <button type="button" onClick={useDemoImage} className="mt-3 text-[12.5px] font-medium text-[#6b7280] transition-colors hover:text-[#0a0a0a]">
            Use demo evidence image
          </button>
        )}

        <div className="mt-6 rounded-xl border border-[#e8e4de] bg-white p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-[#a8a29e]">What happens after upload</p>
          <div className="space-y-2.5">
            {[
              "Image is fingerprinted with mock pHash and SHA-256 values",
              "Agents scan supported domains and mirror networks",
              "Routes are resolved from the takedown CSV registry",
              "Report shows removal contacts, DMCA links, and Gmail-ready notice",
            ].map((text, index) => (
              <div key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#e8e4de] bg-[#fafaf8] font-mono text-[9px] text-[#9ca3af]">
                  {index + 1}
                </span>
                <p className="text-[12.5px] leading-relaxed text-[#6b7280]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

        <div className="mt-8 flex items-center justify-between">
          <Link href="/leak" className="text-[13px] text-[#6b7280] transition-colors hover:text-[#0a0a0a]">
            Back
          </Link>
          <button
            type="button"
            onClick={() => void startScan()}
            disabled={scanning}
            className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start leak scan
          </button>
        </div>
      </main>
    </div>
  );
}

export default function LeakUploadPage() {
  return (
    <Suspense>
      <LeakUploadContent />
    </Suspense>
  );
}
