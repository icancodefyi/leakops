"use client";

import { useEffect } from "react";

type TakedownRoute = {
  domain: string; cdnProvider: string; providerType: string;
  removalPageUrl: string; removalType: string; contactEmail: string;
  lastChecked: string; dataQuality: number;
};

type Props = { caseId: string; routes: TakedownRoute[] };

function qualityLabel(q: number) {
  if (q >= 3) return "Verified";
  if (q === 2) return "Likely";
  return "Review";
}

export function PrintReport({ caseId, routes }: Props) {
  const primary = routes[0];
  const emailRoutes = routes.filter((r) => r.removalType === "email" && r.contactEmail);
  const formRoutes = routes.filter((r) => r.removalType === "form" && r.removalPageUrl);
  const others = routes.filter((r) => r.removalType !== "email" && r.removalType !== "form");

  useEffect(() => {
    window.print();
  }, []);

  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <html>
      <head>
        <title>LeakOps - {caseId}</title>
        <style>{`
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
          .section { margin: 20px 0; }
          .badge { display: inline-block; border: 1px solid #ddd; padding: 2px 8px; border-radius: 10px; font-size: 8pt; }
          .legal { border: 1px solid #ddd; background: #fafaf8; padding: 12px; border-radius: 6px; margin: 10px 0; font-size: 10pt; }
          .actions { margin: 16px 0; }
          .actions li { margin-bottom: 6px; }
          @media screen { .print-hint { text-align: center; padding: 20px; background: #f5f5f5; margin-bottom: 20px; border-radius: 8px; } .print-hint button { padding: 10px 24px; font-size: 14px; background: #000; color: #fff; border: none; border-radius: 8px; cursor: pointer; } }
          @media print { .print-hint { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="print-hint">
          <p style={{ margin: "0 0 12px", fontSize: "14px" }}>Use <strong>Save as PDF</strong> in the print dialog.</p>
          <button onClick={() => window.print()}>Print / Save PDF</button>
        </div>

        <h1>LeakOps NCII Investigation Report</h1>
        <p style={{ color: "#666", margin: "0 0 16px" }}>
          Agentic takedown report for case {caseId} — generated {date}
        </p>

        <div className="meta">
          <div className="field"><strong>Case Reference</strong>{caseId}</div>
          <div className="field"><strong>Date</strong>{date}</div>
          <div className="field"><strong>Type</strong>NCII Leak</div>
          <div className="field"><strong>Status</strong>Investigation Complete</div>
        </div>

        <h2>1. Case Summary</h2>
        <p>This report documents the investigation of non-consensual intimate imagery (NCII) linked to case {caseId}. The LeakOps agent cross-referenced submitted evidence against a registry of {routes.length} known platforms to identify distribution surfaces and takedown routes.</p>

        <h2>2. Discovery Findings</h2>
        <p>The agent identified <strong>{routes.length} platforms</strong> where the content may be circulating:</p>
        <table>
          <thead>
            <tr><th>Domain</th><th>Method</th><th>Contact / Route</th><th>Quality</th></tr>
          </thead>
          <tbody>
            {routes.slice(0, 20).map((r) => (
              <tr key={r.domain}>
                <td>{r.domain}</td>
                <td>{r.removalType || "unknown"}</td>
                <td style={{ fontSize: "9pt" }}>{r.contactEmail || r.removalPageUrl || "—"}</td>
                <td><span className="badge">{qualityLabel(r.dataQuality)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>3. Removal Actions</h2>

        {emailRoutes.length > 0 && (
          <div className="section">
            <h3 style={{ fontSize: "10pt", margin: "0 0 8px", color: "#333" }}>Email Takedown Routes</h3>
            <p>Send a formal takedown notice via email to each platform:</p>
            <ol className="actions">
              {emailRoutes.slice(0, 10).map((r) => (
                <li key={r.domain}>
                  <strong>{r.domain}</strong> — {r.contactEmail}
                  <br />Subject: Urgent NCII Removal Request — {caseId}
                </li>
              ))}
            </ol>
          </div>
        )}

        {formRoutes.length > 0 && (
          <div className="section">
            <h3 style={{ fontSize: "10pt", margin: "0 0 8px", color: "#333" }}>Form Takedown Routes</h3>
            <p>Submit a removal request via each platform&apos;s web form:</p>
            <ol className="actions">
              {formRoutes.slice(0, 10).map((r) => (
                <li key={r.domain}>
                  <strong>{r.domain}</strong> — <span style={{ fontSize: "9pt", color: "#555", wordBreak: "break-all" }}>{r.removalPageUrl}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {others.length > 0 && (
          <div className="section">
            <h3 style={{ fontSize: "10pt", margin: "0 0 8px", color: "#333" }}>Manual Review Required</h3>
            <ol className="actions">
              {others.slice(0, 5).map((r) => (
                <li key={r.domain}><strong>{r.domain}</strong> — No direct removal route found</li>
              ))}
            </ol>
          </div>
        )}

        <h2>4. Legal Framework</h2>

        <div className="legal">
          <strong>Information Technology Act, 2000</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
            <li><strong>Section 66E</strong> — Publishing/transmitting images of private areas without consent. Punishable with up to 3 years + fine.</li>
            <li><strong>Section 67</strong> — Publishing obscene material electronically. Up to 5 years + fine.</li>
            <li><strong>Section 67A</strong> — Publishing sexually explicit material. Up to 7 years + fine.</li>
          </ul>
        </div>

        <div className="legal">
          <strong>Indian Penal Code</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
            <li><strong>Section 354C</strong> — Voyeurism: capturing/publishing images of private acts without consent.</li>
            <li><strong>Section 499/500</strong> — Defamation.</li>
          </ul>
        </div>

        <div className="legal">
          <strong>Platform Obligations</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
            <li><strong>IT Act Section 79</strong> — Intermediary safe harbour conditional on timely removal upon knowledge.</li>
            <li><strong>IT Rules 2021</strong> — Grievance officer must act on complaints within 72 hours.</li>
          </ul>
        </div>

        <h2>5. Recommended Actions</h2>
        <ol>
          {emailRoutes.length > 0 && <li>Send email takedown notices to all identified email routes (see Section 3).</li>}
          {formRoutes.length > 0 && <li>Submit removal requests via platform web forms.</li>}
          <li>Monitor for responses within 48 hours.</li>
          <li>If no response, escalate to the platform&apos;s trust &amp; safety team.</li>
          <li>File a complaint at <strong>cybercrime.gov.in</strong> if needed.</li>
        </ol>

        <p style={{ marginTop: "32px", paddingTop: "12px", borderTop: "1px solid #ddd", fontSize: "9pt", color: "#888" }}>
          LeakOps — Impic Labs — {date}. This report is an investigation aid and does not constitute legal advice.
        </p>
      </body>
    </html>
  );
}
