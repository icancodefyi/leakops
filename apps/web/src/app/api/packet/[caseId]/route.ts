import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type RouteRow = {
  domain: string; cdnProvider: string; providerType: string;
  removalPageUrl: string; removalType: string; contactEmail: string;
  lastChecked: string; dataQuality: number;
};

function parseRoutes(csv: string): RouteRow[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? ""]));
    return {
      domain: row.domain, cdnProvider: row.cdn_provider, providerType: row.provider_type,
      removalPageUrl: row.removal_page_url, removalType: row.removal_type,
      contactEmail: row.contact_email, lastChecked: row.last_checked,
      dataQuality: Number(row.data_quality || 0),
    };
  }).filter((r) => r.domain);
}

function buildHtml(caseId: string, routes: RouteRow[]): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const emailRoutes = routes.filter((r) => r.removalType === "email" && r.contactEmail);
  const formRoutes = routes.filter((r) => r.removalType === "form" && r.removalPageUrl);

  const routeRows = routes.slice(0, 20).map((r) => `
    <tr>
      <td>${esc(r.domain)}</td>
      <td>${esc(r.removalType || "unknown")}</td>
      <td>${esc(r.contactEmail || r.removalPageUrl || "—")}</td>
      <td>Q${r.dataQuality}</td>
    </tr>`).join("");

  const emailActions = emailRoutes.slice(0, 10).map((r) => `
    <li><strong>${esc(r.domain)}</strong> — ${esc(r.contactEmail || "")}<br/>
    <span class="sub">Subject: Urgent NCII Removal Request — ${esc(caseId)}</span></li>`).join("");

  const formActions = formRoutes.slice(0, 10).map((r) => `
    <li><strong>${esc(r.domain)}</strong><br/>
    <span class="sub">Form: ${esc(r.removalPageUrl || "")}</span></li>`).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>LeakOps - ${esc(caseId)}</title>
<style>
  @page { margin: 20mm 15mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-family: Georgia, serif; font-size: 22pt; font-weight: 400; margin: 0 0 4px; }
  h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.15em; color: #666; border-top: 2px solid #111; padding-top: 14px; margin-top: 24px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
  .field { border: 1px solid #ddd; padding: 8px 10px; border-radius: 4px; font-size: 10pt; }
  .field strong { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 10pt; text-align: left; }
  th { background: #f5f5f5; text-transform: uppercase; letter-spacing: 0.05em; font-size: 8pt; color: #666; }
  .legal { border: 1px solid #ddd; background: #fafaf8; padding: 12px; border-radius: 6px; margin: 10px 0; font-size: 10pt; }
  .sub { font-size: 9pt; color: #666; word-break: break-all; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9pt; color: #888; }
</style></head><body>
<h1>LeakOps NCII Investigation Report</h1>
<p style="color:#666;margin:0 0 16px;">Case ${esc(caseId)} — ${date}</p>

<div class="meta">
  <div class="field"><strong>Case</strong>${esc(caseId)}</div>
  <div class="field"><strong>Date</strong>${date}</div>
  <div class="field"><strong>Type</strong>NCII Leak</div>
  <div class="field"><strong>Platforms Found</strong>${routes.length}</div>
</div>

<h2>1. Discovery Findings</h2>
<table><thead><tr><th>Domain</th><th>Method</th><th>Contact</th><th>Quality</th></tr></thead>
<tbody>${routeRows}</tbody></table>

<h2>2. Removal Actions</h2>
${emailActions ? `<h3 style="font-size:10pt;">Email Routes</h3><ol>${emailActions}</ol>` : ""}
${formActions ? `<h3 style="font-size:10pt;">Form Routes</h3><ol>${formActions}</ol>` : ""}

<h2>3. Legal Framework</h2>
<div class="legal"><strong>IT Act, 2000</strong>
<ul style="margin:4px 0 0;padding-left:18px;">
<li><strong>Section 66E</strong> — Publishing private images without consent. Up to 3 years + fine.</li>
<li><strong>Section 67</strong> — Publishing obscene material. Up to 5 years + fine.</li>
<li><strong>Section 67A</strong> — Publishing sexually explicit material. Up to 7 years + fine.</li>
</ul></div>
<div class="legal"><strong>Indian Penal Code</strong>
<ul style="margin:4px 0 0;padding-left:18px;">
<li><strong>Section 354C</strong> — Voyeurism.</li>
<li><strong>Section 499/500</strong> — Defamation.</li>
</ul></div>

<h2>4. Next Steps</h2>
<ol>
${emailRoutes.length ? "<li>Send email notices to all email routes.</li>" : ""}
${formRoutes.length ? "<li>Submit requests via platform forms.</li>" : ""}
<li>Monitor for responses within 48 hours.</li>
<li>Escalate to trust & safety if no response.</li>
<li>File at <strong>cybercrime.gov.in</strong> if needed.</li>
</ol>

<div class="footer">LeakOps — Impic Labs — ${date}. Investigation aid, not legal advice.</div>
</body></html>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const csvPath = path.resolve(process.cwd(), "../../packages/shared/data/takedown-routes.csv");
  const csv = await readFile(csvPath, "utf8");
  const routes = parseRoutes(csv);
  const html = buildHtml(caseId, routes);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="leakops-${caseId}-report.html"`,
    },
  });
}
