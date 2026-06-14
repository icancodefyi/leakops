import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#f0ede8] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
            LeakOps
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-rose-500">
            Agentic NCII takedown
          </p>
          <h1 className="serif-title mx-auto mb-4 max-w-2xl text-4xl leading-snug text-[#0a0a0a]">
            Paste a link. Upload a photo. Chat with an agent.
          </h1>
          <p className="mx-auto max-w-xl text-[14px] leading-7 text-[#6b7280]">
            LeakOps Agent checks where your content has appeared, explains your legal rights, and drafts takedown notices — all in one conversation.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/chat"
            className="group relative block rounded-2xl border border-[#e8e4de] bg-white p-7 transition-all hover:border-rose-400 hover:shadow-[0_0_0_3px_rgba(244,63,94,0.07)]"
          >
            <div className="flex items-start gap-5">
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="1.75">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2.5">
                  <p className="text-[17px] font-semibold tracking-tight text-[#0a0a0a]">
                    Start AI Investigation
                  </p>
                  <span className="shrink-0 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-rose-600">
                    New
                  </span>
                </div>
                <p className="mb-4 text-[13.5px] leading-relaxed text-[#6b7280]">
                  Upload evidence or paste a URL, then chat with the agent to find where content appears, learn about applicable laws, and get takedown notices drafted.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Agent chat", "Platform lookup", "Legal guidance", "Notice drafting"].map((feature) => (
                    <span key={feature} className="rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 font-mono text-[11px] text-[#6b7280]">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8e4de] bg-[#fafaf8] transition-colors group-hover:border-rose-300 group-hover:bg-rose-50">
                <svg width="13" height="13" fill="none" stroke="#f43f5e" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/new"
            className="group relative block rounded-2xl border border-dashed border-[#e8e4de] bg-[#fafaf8] p-5 transition-all hover:border-[#9ca3af] hover:bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8e4de] bg-white">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.75">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12h8M8 16h5M8 8h8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2.5">
                  <p className="text-[13.5px] font-semibold tracking-tight text-[#374151]">Classic investigation flow</p>
                  <span className="rounded-full border border-[#e8e4de] bg-[#f0ede8] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[#6b7280]">
                    Step-by-step
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-[#9ca3af]">
                  The original Sniffer-style flow with source selection, upload, mock agent scan, and report.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/supported-platforms"
            className="group relative block rounded-2xl border border-dashed border-[#e8e4de] bg-[#fafaf8] p-5 transition-all hover:border-[#9ca3af] hover:bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8e4de] bg-white">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2.5">
                  <p className="text-[13.5px] font-semibold tracking-tight text-[#374151]">Supported platforms</p>
                  <span className="rounded-full border border-[#e8e4de] bg-[#f0ede8] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[#6b7280]">
                    CSV
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-[#9ca3af]">
                  Browse the takedown registry used by the agent.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
