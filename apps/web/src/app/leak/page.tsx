"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

const SOURCES = [
  { value: "Telegram", label: "Telegram", desc: "Private channel, group, or forwarded MMS" },
  { value: "Instagram", label: "Instagram", desc: "Story, reel, post, or DM share" },
  { value: "WhatsApp", label: "WhatsApp", desc: "Forwarded media or group leak" },
  { value: "Reddit", label: "Reddit", desc: "Community post or re-upload" },
  { value: "mydesi.ltd", label: "mydesi.ltd", desc: "Adult content domain" },
  { value: "desileak49.com", label: "desileak49.com", desc: "Known high-risk domain" },
  { value: "Other website", label: "Other website", desc: "Any other URL or platform" },
];

const defaultUrl = "https://desileak49.com/watch/leaked-mms-23891";

export default function LeakPage() {
  const router = useRouter();
  const [source, setSource] = useState("Telegram");
  const [sourceUrl, setSourceUrl] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const caseId = "LO-23891";
    const payload = {
      caseId,
      source,
      sourceUrl,
      createdAt: Date.now(),
      issueType: "MMS / NCII leak",
    };

    try {
      sessionStorage.setItem("leakops_case", JSON.stringify(payload));
    } catch {
      // Demo should continue even when storage is unavailable.
    }

    window.setTimeout(() => {
      router.push(`/leak/upload?caseId=${caseId}`);
    }, 450);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-3 border-b border-[#f0ede8] px-6 py-4">
        <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
          LeakOps
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/start" className="text-[13px] text-[#9ca3af] transition-colors hover:text-[#0a0a0a]">
          Start
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">MMS discovery</span>
      </header>

      <main className="mx-auto max-w-xl px-6 py-14">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600">Pipeline - MMS Leak Discovery</span>
        </div>

        <h1 className="serif-title mb-2 mt-4 text-3xl leading-snug text-[#0a0a0a]">Where was the content found?</h1>
        <p className="mb-8 text-[14px] leading-7 text-[#6b7280]">
          Select the platform and paste the source URL. The rest of the flow runs in demo mode with mock agents and route data.
        </p>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="mb-3 block font-mono text-[11px] uppercase tracking-widest text-[#a8a29e]">Source platform</label>
            <div className="flex flex-col gap-2">
              {SOURCES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSource(item.value)}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                    source === item.value ? "border-rose-400 bg-rose-50 ring-1 ring-rose-100" : "border-[#e8e4de] bg-white hover:border-[#9ca3af]"
                  }`}
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-[#0a0a0a]">{item.label}</span>
                    <span className="mt-0.5 block text-[12px] text-[#9ca3af]">{item.desc}</span>
                  </span>
                  {source === item.value && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500">
                      <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="source-url" className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-[#a8a29e]">
              Source URL
            </label>
            <input
              id="source-url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              className="w-full rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3 font-mono text-[12px] text-[#374151] outline-none transition-colors focus:border-[#0a0a0a] focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/start" className="text-[13px] text-[#6b7280] transition-colors hover:text-[#0a0a0a]">
              Back
            </Link>
            <button
              type="submit"
              disabled={loading || !sourceUrl.trim()}
              className="flex items-center gap-2 rounded-full bg-rose-500 px-7 py-3 text-[13px] font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating case...
                </>
              ) : (
                "Upload image"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
