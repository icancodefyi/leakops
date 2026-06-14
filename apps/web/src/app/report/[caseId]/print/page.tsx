import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrintReport } from "./PrintReport";

type Props = { params: Promise<{ caseId: string }> };

type TakedownRoute = {
  domain: string; cdnProvider: string; providerType: string;
  removalPageUrl: string; removalType: string; contactEmail: string;
  lastChecked: string; dataQuality: number;
};

function parseRoutes(csv: string): TakedownRoute[] {
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

async function loadRoutes() {
  const csvPath = path.resolve(process.cwd(), "../../packages/shared/data/takedown-routes.csv");
  return parseRoutes(await readFile(csvPath, "utf8"));
}

export default async function PrintPage({ params }: Props) {
  const { caseId } = await params;
  const routes = await loadRoutes();
  return <PrintReport caseId={caseId} routes={routes} />;
}
