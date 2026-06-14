"use client";

import { useMemo, useState } from "react";

export type PlatformCard = {
  domain: string;
  providerType: string;
  removalType: string;
  removalPageUrl: string;
  contactEmail: string;
  dataQuality: number;
  supported: boolean;
};

function pretty(value: string, fallback: string) {
  return value ? value.replace(/_/g, " ") : fallback;
}

function PlatformGrid({ platforms }: { platforms: PlatformCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {platforms.map((platform) => (
        <article key={platform.domain} className="rounded-xl border border-[#e8e4de] bg-white px-4 py-4 transition-colors hover:border-[#c4bdb5]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[#f0ede8] bg-[#fafaf8]">
            <span className="font-mono text-[13px] uppercase tracking-wider text-[#6b7280]">{platform.domain.slice(0, 2)}</span>
          </div>

          <p className="mb-2 break-all text-[12.5px] font-semibold text-[#0a0a0a]">{platform.domain}</p>

          <div className="space-y-1.5">
            <p className="text-[11px] capitalize text-[#6b7280]">
              <span className="font-medium text-[#374151]">Route:</span> {pretty(platform.removalType, "Route unavailable")}
            </p>
            <p className="text-[11px] capitalize text-[#6b7280]">
              <span className="font-medium text-[#374151]">Infra:</span> {pretty(platform.providerType, "Unknown infra")}
            </p>
            <p className="font-mono text-[10.5px] text-[#9ca3af]">Q{platform.dataQuality}</p>
            {platform.supported && platform.removalPageUrl ? (
              <a href={platform.removalPageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-[11px] text-rose-600 hover:underline">
                Open route
              </a>
            ) : (
              <p className="text-[11px] text-[#9ca3af]">No route yet</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function SupportedPlatformsClient({ platforms }: { platforms: PlatformCard[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return platforms;
    return platforms.filter((platform) => platform.domain.toLowerCase().includes(normalized));
  }, [platforms, query]);

  const supported = filtered.filter((platform) => platform.supported);
  const review = filtered.filter((platform) => !platform.supported);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#a8a29e]">Known Platforms</p>
          <span className="text-[20px] font-semibold leading-none text-[#0a0a0a]">{platforms.length}</span>
        </div>

        <div className="w-full sm:max-w-sm">
          <label htmlFor="platform-search" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[#a8a29e]">
            Search Platforms
          </label>
          <input
            id="platform-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by domain..."
            className="w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-[12.5px] text-[#374151] outline-none placeholder:text-[#c4bdb5] transition-colors focus:border-[#0a0a0a]"
          />
        </div>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-rose-500">Route Available</p>
            <h2 className="text-[20px] font-semibold text-[#0a0a0a]">Supported for Takedown</h2>
          </div>
          <span className="text-[12px] text-[#9ca3af]">{supported.length} shown</span>
        </div>

        {supported.length > 0 ? (
          <PlatformGrid platforms={supported} />
        ) : (
          <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-6 text-[12.5px] text-[#6b7280]">No supported platforms match your search.</div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#a8a29e]">Tracked Only</p>
            <h2 className="text-[20px] font-semibold text-[#0a0a0a]">Platforms Needing Review</h2>
          </div>
          <span className="text-[12px] text-[#9ca3af]">{review.length} shown</span>
        </div>

        {review.length > 0 ? (
          <PlatformGrid platforms={review} />
        ) : (
          <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-6 text-[12.5px] text-[#6b7280]">Every visible platform has a route.</div>
        )}
      </section>
    </>
  );
}
