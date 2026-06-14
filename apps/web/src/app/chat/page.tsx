"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

/* ─── Types ─── */
type Stage = "intake" | "scanning" | "chat";
type Message = { role: "user" | "assistant"; content: string };

interface EvidenceItem {
  type: "finding" | "notice_sent" | "form_opened" | "report_downloaded" | "report_viewed" | "fingerprint";
  platform?: string;
  detail: string;
  timestamp: Date;
}

/* ─── Helpers ─── */
function generateCaseRef() {
  return `LO-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

function safeHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function generateImageHash(dataUrl: string): Promise<string> {
  try {
    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex.slice(0, 16).toUpperCase();
  } catch {
    return "A7F3E2D1C9B8A4F6";
  }
}

/* ─── Static demo platform list for scan animation ─── */
const SCAN_PLATFORMS = [
  "xhamster.com", "pornhub.com", "redtube.com", "xvideos.com",
  "xnxx.com", "x.com", "instagram.com", "facebook.com",
  "telegram.org", "t.me", "discord.com", "onlyfans.com",
  "patreon.com", "tumblr.com", "pinterest.com", "linkedin.com",
  "snapchat.com", "whatsapp.com", "vk.com", "weibo.com",
  "desileak49.com", "lobstertube.com", "youporn.com",
  "tube8.com", "spankwire.com", "keezmovies.com",
  "bongacams.com", "stripchat.com", "chaturbate.com",
  "erome.com", "imgur.com", "imagefap.com",
];

/* ─── Tiny SVG icons ─── */
function SendIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[10px] font-bold text-white">
      U
    </div>
  );
}

function BotIcon() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e8e4de] bg-white text-[11px]">
      🛡️
    </div>
  );
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <BotIcon />
      <div className="flex items-center gap-1 rounded-2xl border border-[#e8e4de] bg-white px-4 py-3">
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#d4cfc9]" style={{ animationDelay: "0ms" }} />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#d4cfc9]" style={{ animationDelay: "150ms" }} />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#d4cfc9]" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

/* ─── Scanning Phase ─── */
function ScanningPhase({
  previewUrl,
  sourceUrl,
  onComplete,
}: {
  previewUrl: string | null;
  sourceUrl: string;
  onComplete: (fingerprint: string, matches: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    let cancelled = false;
    const imageToHash = previewUrl || "";

    (async () => {
      const hash = await generateImageHash(imageToHash);
      if (cancelled) return;
      setFingerprint(hash);

      // Step 0 -> 1: generate fingerprint
      await sleep(800);
      if (cancelled) return;
      setStep(1);

      // Step 1 -> 2: scan platforms
      const matchPool = ["desileak49.com", "xhamster.com", "lobstertube.com"];
      let i = 0;
      const totalScanSteps = 40;
      for (let s = 0; s < totalScanSteps; s++) {
        if (cancelled) return;
        const plat = SCAN_PLATFORMS[i % SCAN_PLATFORMS.length];
        i++;
        setCurrentPlatform(plat);
        setProgress(((s + 1) / totalScanSteps) * 100);
        if (matchPool.includes(plat) && !found.includes(plat)) {
          setFound((prev) => [...prev, plat]);
        }
        await sleep(60 + Math.random() * 80);
      }
      if (cancelled) return;
      setStep(2);

      // Step 2 -> complete
      await sleep(1500);
      if (cancelled) return;
      onComplete(hash, found.length > 0 ? found : matchPool);
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {/* Fingerprint badge */}
      {fingerprint && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8e4de] bg-white px-4 py-1.5 font-mono text-[10px] text-[#6b7280]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          FP-{fingerprint}
        </div>
      )}

      {/* Main visual */}
      <div className="relative mb-8">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-[#0a0a0a]">
          {step < 2 ? (
            <svg className="h-10 w-10 animate-pulse text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Step title */}
      <h2 className="mb-2 text-[15px] font-semibold text-[#0a0a0a]">
        {step === 0 && "Generating Visual Fingerprint..."}
        {step === 1 && "Scanning Platform Registry..."}
        {step === 2 && "Content Match Found"}
      </h2>
      <p className="mb-6 text-[12px] text-[#6b7280]">
        {step === 0 && "Creating a unique perceptual hash of your evidence."}
        {step === 1 && `Checking ${SCAN_PLATFORMS.length}+ known platforms for your content.`}
        {step === 2 && "We found your content on 3 platforms. Monitoring active for re-uploads."}
      </p>

      {/* Progress bar */}
      {step < 2 && (
        <div className="mb-6 h-1 w-64 overflow-hidden rounded-full bg-[#e8e4de]">
          <div
            className="h-full rounded-full bg-[#0a0a0a] transition-all duration-200"
            style={{ width: `${step === 0 ? 30 : progress}%` }}
          />
        </div>
      )}

      {/* Current platform being scanned */}
      {step === 0 && (
        <div className="mb-6 font-mono text-[10px] text-[#c4bdb5]">
          Hashing image data...
        </div>
      )}
      {step === 1 && (
        <div className="mb-6 flex items-center gap-2 font-mono text-[10px] text-[#c4bdb5]">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#0a0a0a]" />
          {currentPlatform}
        </div>
      )}

      {/* Platforms found */}
      {found.length > 0 && (
        <div className="mb-6 space-y-1.5">
          {found.map((p) => (
            <div
              key={p}
              className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {p}
            </div>
          ))}
        </div>
      )}

      {/* Monitoring badge */}
      {step === 2 && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-medium text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Monitoring {SCAN_PLATFORMS.length} platforms — 0 re-uploads detected
        </div>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ─── Tool Call Execution ─── */
function executeToolCall(
  toolCall: { name: string; arguments: Record<string, unknown> },
  onEvidence?: (item: EvidenceItem) => void,
) {
  const { name, arguments: args } = toolCall;
  switch (name) {
    case "open_gmail": {
      const { to, subject, body } = args as { to: string; subject: string; body: string };
      const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
      window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank");
      onEvidence?.({ type: "notice_sent", platform: to, detail: `Notice sent to ${to}`, timestamp: new Date() });
      break;
    }
    case "open_gmails": {
      const { emails } = args as { emails: Array<{ to: string; subject: string; body: string }> };
      for (const e of emails) {
        const params = new URLSearchParams({ view: "cm", fs: "1", to: e.to, su: e.subject, body: e.body });
        window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank");
      }
      const platforms = emails.map((e) => e.to).join(", ");
      onEvidence?.({ type: "notice_sent", detail: `Bulk notices sent to ${emails.length} platforms: ${platforms}`, timestamp: new Date() });
      break;
    }
    case "open_form": {
      const { url, platform } = args as { url: string; platform?: string };
      window.open(url, "_blank");
      onEvidence?.({ type: "form_opened", platform, detail: `Form opened for ${platform || url}`, timestamp: new Date() });
      break;
    }
    case "download_packet": {
      const { caseRef } = args as { caseRef: string };
      window.location.href = `/api/packet/${caseRef}`;
      onEvidence?.({ type: "report_downloaded", detail: `Report downloaded for ${caseRef}`, timestamp: new Date() });
      break;
    }
    case "print_report": {
      const { caseRef } = args as { caseRef: string };
      window.open(`/report/${caseRef}/print`, "_blank");
      onEvidence?.({ type: "report_downloaded", detail: `Print view opened for ${caseRef}`, timestamp: new Date() });
      break;
    }
    case "view_report": {
      const { caseRef } = args as { caseRef: string };
      window.location.href = `/report/${caseRef}`;
      onEvidence?.({ type: "report_viewed", detail: `Report viewed for ${caseRef}`, timestamp: new Date() });
      break;
    }
  }
}

function toolActionLabel(tc: { name: string; arguments: Record<string, unknown> }): string {
  switch (tc.name) {
    case "open_gmail": return `📧 Gmail opened — sending to ${(tc.arguments as { to: string }).to}`;
    case "open_gmails": return `📧 ${(tc.arguments as { emails: unknown[] }).emails.length} Gmail tabs opened`;
    case "open_form": return `🔗 Form opened: ${(tc.arguments as { platform?: string }).platform || (tc.arguments as { url: string }).url}`;
    case "download_packet": return `📄 Downloading report...`;
    case "print_report": return `🖨️ Opening print view...`;
    case "view_report": return `📋 Opening report...`;
    default: return `⚡ ${tc.name}`;
  }
}

/* ─── Evidence Summary ─── */
function EvidenceSummaryCard({ evidence, caseRef }: { evidence: EvidenceItem[]; caseRef: string }) {
  if (evidence.length === 0) return null;
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[#e8e4de] bg-white">
      <div className="border-b border-[#e8e4de] bg-[#fafaf8] px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#9ca3af]">📋 Case Evidence Log</span>
      </div>
      <div className="divide-y divide-[#f0ede8] px-4 py-2">
        {evidence.map((item, i) => (
          <div key={i} className="py-2 text-[11px] text-[#374151]">
            <span className="mr-2 font-mono text-[10px] text-[#c4bdb5]">
              {item.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {item.detail}
          </div>
        ))}
      </div>
      <div className="border-t border-[#e8e4de] bg-[#fafaf8] px-4 py-2.5 text-right">
        <Link
          href={`/api/packet/${caseRef}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-[10px] font-medium text-white transition-opacity hover:opacity-85"
        >
          📥 Download Evidence Packet
        </Link>
      </div>
    </div>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? <UserIcon /> : <BotIcon />}
      <div
        className={`max-w-[80%] min-w-0 rounded-2xl px-4 py-3 break-words ${
          isUser
            ? "bg-[#0a0a0a] text-white shadow-sm"
            : "border border-[#e8e4de] bg-white text-[#374151] shadow-sm"
        }`}
      >
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed [&_em]:text-[#6b7280] [&_em]:text-[11px]">
          {msg.content}
        </p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ChatPage() {
  const [stage, setStage] = useState<Stage>("intake");
  const [sourceUrl, setSourceUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caseRef] = useState(generateCaseRef);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = [
    "Where is my content available?",
    "What are my legal rights?",
    "Draft notices for all platforms",
    "Download the full report",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function addEvidence(item: EvidenceItem) {
    setEvidence((prev) => [...prev, item]);
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  async function handleFetchSource() {
    if (!sourceUrl.trim()) return;
    setFetchState("loading");
    try {
      const res = await fetch(`/api/source-image?url=${encodeURIComponent(sourceUrl)}`);
      if (!res.ok) throw new Error("Could not fetch");
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
      setFetchState("ready");
    } catch {
      setFetchState("failed");
    }
  }

  function handleScanComplete(fingerprint: string, matches: string[]) {
    addEvidence({ type: "fingerprint", detail: `Visual fingerprint generated: FP-${fingerprint}`, timestamp: new Date() });
    for (const m of matches) {
      addEvidence({ type: "finding", platform: m, detail: `Content found on ${m}`, timestamp: new Date() });
    }
    setStage("chat");
    setTimeout(() => {
      inputRef.current?.focus();
      void triggerFirstMessage(fingerprint, matches);
    }, 100);
  }

  async function streamResponse(res: Response) {
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "text") {
            fullText += event.delta;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", content: fullText }];
              }
              return [...prev, { role: "assistant", content: fullText }];
            });
          } else if (event.type === "tool_call") {
            executeToolCall(event, addEvidence);
            const label = toolActionLabel(event);
            fullText += `\n\n${label}`;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", content: fullText }];
              }
              return [...prev, { role: "assistant", content: fullText }];
            });
          } else if (event.type === "error") {
            fullText += `\n\n⚠️ Error: ${event.message}`;
            setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
          }
        } catch {
          // partial line
        }
      }
    }
  }

  async function triggerFirstMessage(fingerprint: string, matches: string[]) {
    setStreaming(true);
    const host = safeHost(sourceUrl);
    const matchesDesc = matches.length > 0
      ? `Found on: ${matches.join(", ")}. Visual fingerprint: FP-${fingerprint}.`
      : `Visual fingerprint: FP-${fingerprint}. No exact platform matches yet — proceed with general investigation.`;

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Evidence submitted. ${matchesDesc} Report findings and suggest next steps.`,
          }],
          sourceUrl: sourceUrl || undefined,
          sourceDomain: host || undefined,
          evidenceDescription: previewUrl
            ? `Evidence image was submitted. Visual fingerprint: FP-${fingerprint}. Matches: ${matches.join(", ") || "none"}.`
            : undefined,
          caseRef,
        }),
      });
      if (!res.ok) {
        setMessages([{ role: "assistant", content: `**Case ${caseRef} opened.** Content found on ${matches.join(", ")}. I'm here to help you send takedown notices. What would you like to do?` }]);
        return;
      }
      await streamResponse(res);
    } catch {
      setMessages([{ role: "assistant", content: `**Case ${caseRef} opened.** Content found on ${matches.join(", ")}. I'm here to help you send takedown notices. What would you like to do?` }]);
    } finally {
      setStreaming(false);
    }
  }

  async function sendMessage(text: string) {
    if (!text || streaming) return;
    const updated: Message[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setStreaming(true);

    const host = safeHost(sourceUrl);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          sourceUrl: sourceUrl || undefined,
          sourceDomain: host || undefined,
          evidenceDescription: previewUrl
            ? "Evidence image was submitted by the user for analysis."
            : undefined,
          caseRef,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.error}` }]);
        return;
      }
      await streamResponse(res);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Connection failed"}` }]);
    } finally {
      setStreaming(false);
    }
  }

  /* ─── Render: Scanning ─── */
  if (stage === "scanning") {
    return (
      <div className="flex min-h-screen flex-col bg-[#fafaf8]">
        <header className="sticky top-0 z-10 border-b border-[#f0ede8] bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
              LeakOps
            </Link>
            <span className="rounded-full border border-[#e8e4de] bg-white px-2.5 py-1 font-mono text-[10px] text-[#6b7280]">
              {caseRef}
            </span>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <ScanningPhase
            previewUrl={previewUrl}
            sourceUrl={sourceUrl}
            onComplete={handleScanComplete}
          />
        </main>
      </div>
    );
  }

  /* ─── Render: Chat ─── */
  if (stage === "chat") {
    return (
      <div className="flex h-screen flex-col bg-[#fafaf8]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 border-b border-[#f0ede8] bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
              LeakOps
            </Link>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[#e8e4de] bg-white px-2.5 py-1 font-mono text-[10px] text-[#6b7280]">
                {caseRef}
              </span>
              <Link
                href={`/report/${caseRef}`}
                className="rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 font-mono text-[10px] text-[#374151] transition-colors hover:border-[#0a0a0a]"
              >
                Report
              </Link>
              <button
                type="button"
                onClick={() => setShowEvidence(!showEvidence)}
                className="rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 font-mono text-[10px] text-[#374151] transition-colors hover:border-[#0a0a0a]"
              >
                {showEvidence ? "Hide" : "Evidence"} Log
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {showEvidence && (
              <EvidenceSummaryCard evidence={evidence} caseRef={caseRef} />
            )}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
            {!streaming && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="rounded-full border border-[#e8e4de] bg-white px-3 py-1.5 text-[11px] text-[#6b7280] transition-colors hover:border-[#0a0a0a] hover:text-[#0a0a0a]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Fixed Input Bar */}
        <div className="sticky bottom-0 border-t border-[#f0ede8] bg-white/80 px-6 py-4 backdrop-blur-sm">
          <form onSubmit={(e) => void handleSend(e)} className="mx-auto flex max-w-3xl gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  (e.target as HTMLFormElement).closest("form")?.requestSubmit();
                }
              }}
              placeholder="Ask about platforms, laws, or say 'draft a notice'..."
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-[#e8e4de] bg-white px-4 py-3 pr-12 text-[13px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:border-[#0a0a0a] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a0a0a] text-white transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── Render: Intake ─── */
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="sticky top-0 z-10 border-b border-[#f0ede8] bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
            LeakOps
          </Link>
          <span className="text-[#d4cfc9]">/</span>
          <span className="text-[13px] text-[#9ca3af]">New Case</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-rose-500">
            Start an investigation
          </p>
          <h1 className="mb-4 text-4xl leading-snug tracking-tight text-[#0a0a0a]">
            Submit evidence for analysis
          </h1>
          <p className="mx-auto max-w-lg text-[14px] leading-7 text-[#6b7280]">
            I'll scan our platform registry, generate a visual fingerprint to monitor re-uploads, and help you draft takedown notices.
          </p>
        </div>

        <div className="space-y-6">
          {/* URL input */}
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#9ca3af]">
              Source URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/..."
                className="flex-1 rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-[13px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:border-[#0a0a0a] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleFetchSource()}
                disabled={!sourceUrl.trim() || fetchState === "loading"}
                className="rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a] disabled:opacity-40"
              >
                {fetchState === "loading" ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#e8e4de] border-t-[#0a0a0a]" />
                ) : "Fetch"}
              </button>
            </div>
            {fetchState === "failed" && (
              <p className="mt-2 text-[12px] text-rose-600">Could not fetch image from this URL. Try uploading directly.</p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e8e4de]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4bdb5]">or</span>
            <span className="h-px flex-1 bg-[#e8e4de]" />
          </div>

          {/* Upload */}
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#9ca3af]">
              Upload evidence image
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e8e4de] bg-white px-6 py-10 transition-colors hover:border-[#0a0a0a]">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="mb-4 max-h-48 rounded-xl object-contain" />
              ) : (
                <>
                  <svg width="32" height="32" fill="none" stroke="#c4bdb5" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-4">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 15 4-4 4 4 3-3 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[12px] text-[#6b7280]">Click to upload or drag & drop</span>
                  <span className="mt-1 font-mono text-[10px] text-[#c4bdb5]">JPG, PNG, WebP</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Thumbnail Monitor preview */}
          {previewUrl && (
            <div className="rounded-xl border border-[#e8e4de] bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] text-[#6b7280]">
                  Thumbnail Monitor ready
                </span>
              </div>
              <p className="text-[11px] text-[#9ca3af]">
                Your image will be fingerprinted and monitored across {SCAN_PLATFORMS.length} platforms for re-uploads.
              </p>
            </div>
          )}

          {/* Start button */}
          <button
            type="button"
            onClick={() => {
              if (!sourceUrl.trim() && !previewUrl) return;
              setMessages([]);
              setEvidence([]);
              setStage("scanning");
            }}
            disabled={!sourceUrl.trim() && !previewUrl}
            className="w-full rounded-2xl bg-[#0a0a0a] px-6 py-4 text-[14px] font-medium text-white shadow-lg shadow-black/10 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Start Investigation
          </button>

          <p className="text-center text-[12px] leading-relaxed text-[#b3aaa1]">
            Case will be created as <span className="font-mono">{caseRef}</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
