"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Stage = "intake" | "chat";
type Message = { role: "user" | "assistant"; content: string };

function generateCaseRef() {
  const num = String(Math.floor(Math.random() * 90000) + 10000);
  return `LO-${num}`;
}

function safeHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function SendIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#e8e4de] border-t-[#0a0a0a]" />;
}

function ActionButton({ href, label }: { href: string; label: string }) {
  const action = href.replace("action:", "");
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    const [type, ...rest] = action.split(":");
    const payload = rest.join(":");

    switch (type) {
      case "open_gmail": {
        const parts = payload.split("::");
        const to = parts[0] || "";
        const subject = parts[1] || "";
        const body = parts[2] || "";
        const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
        window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank");
        break;
      }
      case "open_gmails": {
        const entries = payload.split("||");
        for (const entry of entries) {
          const [to, subject, body] = entry.split("::");
          const params = new URLSearchParams({ view: "cm", fs: "1", to: to || "", su: subject || "", body: body || "" });
          window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank");
        }
        break;
      }
      case "copy":
        navigator.clipboard.writeText(payload).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
        break;
      case "open_form":
        window.open(payload, "_blank");
        break;
      case "view_report":
        window.location.href = `/report/${payload}`;
        break;
      case "download_packet":
        window.location.href = `/api/packet/${payload}`;
        break;
      case "print_report":
        window.open(`/report/${payload}/print`, "_blank");
        break;
      case "open_form_url":
        window.open(payload, "_blank");
        break;
    }
  };

  if (action.startsWith("copy:")) {
    const textToCopy = action.slice(5);
    return (
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(textToCopy).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 text-[11px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
      >
        {copied ? "Copied" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a0a0a] bg-[#0a0a0a] px-3 py-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-85"
    >
      {label}
    </button>
  );
}

const markdownComponents: Components = {
  a: ({ href, children }) => {
    if (href?.startsWith("action:")) {
      const label = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "Execute";
      return <ActionButton href={href} label={label} />;
    }
    return <a href={href} target="_blank" rel="noreferrer" className="text-[#6366f1] underline underline-offset-2 hover:text-[#f43f5e]">{children}</a>;
  },
  code: ({ children, className }) => {
    if (className?.includes("language-notice")) {
      const content = String(children).replace(/\n$/, "");
      return (
        <div className="my-3 overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fafaf8]">
          <div className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-4 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#9ca3af]">Takedown Notice</span>
            <ActionButton href={`action:copy:${content}`} label="Copy" />
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all bg-white px-4 py-3 font-mono text-[11px] leading-relaxed text-[#374151]">{content}</pre>
        </div>
      );
    }
    return <code className="rounded break-all bg-[#f0ede8] px-1.5 py-0.5 font-mono text-[11.5px] text-[#0a0a0a]">{children}</code>;
  },
  ul: ({ children }) => <ul className="mb-2 mt-1 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 mt-1 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="text-[13px] leading-relaxed text-[#374151]">{children}</li>,
  p: ({ children }) => <p className="mb-2 text-[13px] leading-relaxed text-[#374151] last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[#0a0a0a]">{children}</strong>,
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-[17px] font-semibold text-[#0a0a0a]">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 text-[15px] font-semibold text-[#0a0a0a]">{children}</h2>,
  hr: () => <hr className="my-4 border-[#e8e4de]" />,
};

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-3 break-words ${
          isUser
            ? "bg-[#0a0a0a] text-white"
            : "border border-[#e8e4de] bg-white text-[#374151]"
        }`}
      >
        {isUser ? (
          <p className="text-[13px] leading-relaxed">{msg.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [stage, setStage] = useState<Stage>("intake");
  const [sourceUrl, setSourceUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caseRef] = useState(generateCaseRef);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
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

  function handleStartChat() {
    if (!sourceUrl.trim() && !previewUrl) return;
    setMessages([]);
    setStage("chat");
    setTimeout(() => {
      inputRef.current?.focus();
      void triggerFirstMessage();
    }, 100);
  }

  async function triggerFirstMessage() {
    setStreaming(true);
    const host = safeHost(sourceUrl);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "I just submitted evidence for investigation. Tell me what you found and what platforms my content appears on." }],
          sourceUrl: sourceUrl || undefined,
          sourceDomain: host || undefined,
          evidenceDescription: previewUrl ? "Evidence image was submitted by the user for analysis." : undefined,
        }),
      });
      if (!res.ok) {
        setMessages([{ role: "assistant", content: `Case ${caseRef} opened. How can I help?` }]);
        setStreaming(false);
        return;
      }
      const reader = res.body?.getReader();
      let fullText = "";
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setMessages([{ role: "assistant", content: fullText }]);
        }
      }
    } catch {
      setMessages([{ role: "assistant", content: `Case ${caseRef} opened. How can I help?` }]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
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
          evidenceDescription: previewUrl ? "Evidence image was submitted by the user for analysis." : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.error}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      let fullText = "";
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [...prev.slice(0, -1), { role: "assistant", content: fullText }];
            }
            return [...prev, { role: "assistant", content: fullText }];
          });
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Connection failed"}` }]);
    } finally {
      setStreaming(false);
    }
  }

  const chatPage = (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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
            Full Report
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        {streaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[#e8e4de] bg-white px-4 py-3">
              <Spinner />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => void handleSend(e)} className="relative">
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
          rows={2}
          className="w-full resize-none rounded-2xl border border-[#e8e4de] bg-white px-4 py-3 pr-12 text-[13px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:border-[#0a0a0a] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[#0a0a0a] text-white transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );

  if (stage === "chat") return chatPage;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-[#f0ede8] px-6 py-4">
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
          <h1 className="serif-title mx-auto mb-4 text-4xl leading-snug text-[#0a0a0a]">
            Paste a link or upload evidence
          </h1>
          <p className="mx-auto max-w-lg text-[14px] leading-7 text-[#6b7280]">
            I'll analyse the source, check our takedown registry, and help you draft removal notices.
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
                {fetchState === "loading" ? <Spinner /> : "Fetch"}
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
                <img src={previewUrl} alt="Uploaded evidence" className="mb-4 max-h-48 rounded-xl object-contain" />
              ) : (
                <svg width="32" height="32" fill="none" stroke="#c4bdb5" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-4">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 15 4-4 4 4 3-3 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
              <span className="text-[12px] text-[#6b7280]">{previewUrl ? "Tap to replace" : "Click to upload or drag & drop"}</span>
              <span className="mt-1 font-mono text-[10px] text-[#c4bdb5]">JPG, PNG, WebP</span>
            </label>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleStartChat}
            disabled={!sourceUrl.trim() && !previewUrl}
            className="w-full rounded-2xl bg-[#0a0a0a] px-6 py-4 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
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
