import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { SupportedPlatformsClient, type PlatformCard } from "./SupportedPlatformsClient";

function parsePlatforms(csv: string): PlatformCard[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  const byDomain = new Map<string, PlatformCard>();

  for (const line of lines) {
    const values = line.split(",");
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    const domain = row.domain?.toLowerCase();
    if (!domain) continue;

    const next: PlatformCard = {
      domain,
      providerType: row.provider_type || "",
      removalType: row.removal_type || "",
      removalPageUrl: row.removal_page_url || "",
      contactEmail: row.contact_email || "",
      dataQuality: Number(row.data_quality || 0),
      supported: Boolean(row.removal_page_url || row.contact_email),
    };

    const existing = byDomain.get(domain);
    if (!existing || next.dataQuality > existing.dataQuality || (!existing.removalPageUrl && next.removalPageUrl)) {
      byDomain.set(domain, next);
    }
  }

  return Array.from(byDomain.values()).sort((a, b) => {
    if (a.supported !== b.supported) return a.supported ? -1 : 1;
    if (b.dataQuality !== a.dataQuality) return b.dataQuality - a.dataQuality;
    return a.domain.localeCompare(b.domain);
  });
}

async function loadPlatforms() {
  const csvPath = path.resolve(process.cwd(), "../../packages/shared/data/takedown-routes.csv");
  const csv = await readFile(csvPath, "utf8");
  return parsePlatforms(csv);
}

export default async function SupportedPlatformsPage() {
  const platforms = await loadPlatforms();

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-3 border-b border-[#f0ede8] px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-mono text-[13px] uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-70">
          LeakOps
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Supported Platforms</span>
        <Link href="/start" className="ml-auto rounded-full bg-[#0a0a0a] px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#1a1a1a]">
          Start Investigation
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
        <div className="mb-10">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-rose-500">Takedown Coverage</p>
          <h1 className="serif-title mb-3 text-4xl leading-snug text-[#0a0a0a]">Supported Platforms</h1>
          <p className="max-w-3xl text-[14px] leading-relaxed text-[#6b7280]">
            Platforms where LeakOps has mock takedown routing metadata. The Route Agent uses this registry to choose Gmail, platform forms, or escalation.
          </p>
        </div>

        <SupportedPlatformsClient platforms={platforms} />
      </main>
    </div>
  );
}
