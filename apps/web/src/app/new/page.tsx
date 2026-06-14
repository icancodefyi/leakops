import { readFile } from "node:fs/promises";
import path from "node:path";
import { NewCaseFlow, type TakedownRoute } from "./NewCaseFlow";

function parseRouteCsv(csv: string): TakedownRoute[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return lines
    .map((line) => {
      const values = line.split(",");
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));

      return {
        domain: row.domain,
        cdnProvider: row.cdn_provider,
        providerType: row.provider_type,
        removalPageUrl: row.removal_page_url,
        removalType: row.removal_type,
        contactEmail: row.contact_email,
        lastChecked: row.last_checked,
        dataQuality: Number(row.data_quality || 0),
      };
    })
    .filter((route) => route.domain);
}

async function loadRoutes(): Promise<TakedownRoute[]> {
  const csvPath = path.resolve(process.cwd(), "../../packages/shared/data/takedown-routes.csv");
  const csv = await readFile(csvPath, "utf8");
  return parseRouteCsv(csv);
}

export default async function NewCasePage() {
  const routes = await loadRoutes();

  return <NewCaseFlow routes={routes} />;
}
