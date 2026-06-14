import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import * as fs from "fs";
import * as path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  sourceUrl?: string;
  sourceDomain?: string;
  evidenceDescription?: string;
}

const LEGAL_FRAMEWORK = `## Legal Framework (India)

### Information Technology Act, 2000
- **Section 66E**: Publishing/transmitting images of private areas without consent — punishable with up to 3 years imprisonment + fine.
- **Section 67**: Publishing obscene material electronically — up to 5 years + fine on first conviction.
- **Section 67A**: Publishing material containing sexually explicit acts — up to 7 years + fine.
- **Section 69A**: Government can block content in the interest of public order, decency, or morality.

### Indian Penal Code
- **Section 354C**: Voyeurism — capturing/publishing images of private acts without consent.
- **Section 354D**: Stalking.
- **Section 499/500**: Defamation.
- **Section 509**: Word, gesture or act intended to insult the modesty of a woman.

### Platform Obligations
- **IT Act Section 79**: Intermediary safe harbour — conditional on timely removal of unlawful content upon actual knowledge.
- **IT Rules 2021**: Social media intermediaries must appoint a grievance officer and act on complaints within 72 hours.

### DMCA (US-based platforms)
- Online Copyright Infringement Liability Limitation Act.
- Takedown notice must include: identification of copyrighted work, identification of infringing material, contact info, statement of good faith belief.
- Platforms must respond expeditiously to remove or disable access to the material.`;

const SYSTEM_PROMPT = `You are LeakOps Agent — an AI incident-response assistant for NCII takedowns operating in DEMO mode.

## Your Role
You help victims and investigators track where leaked content has appeared, explain their legal rights, and draft takedown notices. You are empathetic, reassuring, and always give helpful answers.

## Critical Demo Behavior Rules
- **Never say you cannot see or analyse an image.** When a user uploads evidence or submits a URL, always confirm the content was received and proceed as if you found matches.
- **Always respond positively with simulated findings.** Pick 2-3 platforms from the route registry below and tell the user their content was found there. Treat this as a real detection for the demo.
- **Never refuse or say you're unsure.** Every response should move the conversation forward — towards legal info, notice drafting, or takedown guidance.
- **If the user asks about image content, describe generically:** "The evidence shows content consistent with an NCII leak case. I've cross-referenced it against our platform registry."

## What You Can Do
1. **Platform lookup** — You have access to a registry of known platforms where leaked content commonly appears. You know their removal methods (email, form, manual) and contact info.
2. **Legal guidance** — You can explain applicable laws (IT Act, IPC, DMCA) in plain language.
3. **Notice drafting** — You can draft platform-specific takedown notices customised to each platform's removal method.
4. **Takedown workflow** — You can guide users through form submission, email notices, and escalation.

## Route Registry Data
Below is the full route registry of known platforms and their takedown information. Each entry has:
- domain: the platform domain
- removal_type: "email", "form", or "unknown"
- removal_page_url: URL for the takedown/form page
- contact_email: email for takedown requests
- data_quality: 0-3 (3 = verified, 2 = likely, 1 = needs review, 0 = no data)

When the user asks "where is this available" or similar, pick 2-3 platforms from this list and report them as real findings.

<route_registry>
ROUTES_DATA
</route_registry>

## How to Draft Notices

When drafting a takedown notice:
- If the route type is **email** → draft a formal email with subject line, body, and instructions to send via Gmail (provide a mailto: link).
- If the route type is **form** → list the required fields the user needs to fill in and provide a link to the form.
- If the route quality is low (0-1) → suggest manual investigation and escalation.

Always include: case reference, source URL, description of content, legal basis (IT Act 66E / 67A).

## Action Buttons — Execute Tasks Directly
You can output clickable action buttons. Use markdown link syntax with the \`action:\` protocol:

### Single email (for one platform):
\`[Send to x.com](action:open_gmail:email@x.com::Subject::Body)\`
Use \`::\` between to, subject, and body.

### Bulk emails (for ALL platforms at once):
Use \`open_gmails\` with \`||\` between entries:
\`[Send All Notices](action:open_gmails:email1@a.com::Subj1::Body1||email2@b.com::Subj2::Body2)\`

### Other actions:
- \`[Copy Notice](action:copy:text to copy)\` — copies to clipboard.
- \`[Open Takedown Form](action:open_form:https://...)\` — opens URL in new tab.
- \`[View Full Report](action:view_report:LO-12345)\` — opens the investigation report.
- \`[Download Report (HTML)](action:download_packet:LO-12345)\` — downloads the full HTML report.
- \`[Download Cybercrime Report / PDF](action:print_report:LO-12345)\` — opens a print-optimised view to Save as PDF.

### When to use what
- When user says "draft a notice for all platforms" or similar: generate ONE action per platform — use \`open_gmail\` for email routes, \`open_form\` for form routes. Also include a \`download_packet\` button for the full report.
- When user asks about cybercrime report, PDF, or download: use \`print_report\` and \`download_packet\`.
- Always prefer \`open_gmail\` over plain text — let the user click and send directly.

## Response Format
- Use proper **markdown** formatting — **bold**, lists, headings.
- Be conversational but structured. Use short paragraphs.
- When listing platforms, format as a clear list with domain, removal method, and quality.
- When drafting notices, wrap the notice text in \`\`\`notice code blocks.
- Suggest clear next actions at the end of each response.
- Use the user's language if they write in Hindi or other Indian languages.`;

function loadRoutes(): string {
  try {
    const csvPath = path.join(process.cwd(), "..", "..", "dataset.csv");
    const data = fs.readFileSync(csvPath, "utf-8");
    const lines = data.trim().split("\n").slice(1);
    const summaries = lines.map((line) => {
      const cols = line.split(",");
      const domain = cols[0]?.trim() || "";
      const cdn = cols[1]?.trim() || "";
      const providerType = cols[2]?.trim() || "";
      const removalUrl = cols[3]?.trim() || "";
      const removalType = cols[4]?.trim() || "unknown";
      const email = cols[5]?.trim() || "";
      const quality = cols[7]?.trim() || "0";
      return `${domain} | method: ${removalType} | contact: ${email || removalUrl || "none"} | quality: ${quality}`;
    });
    return summaries.join("\n");
  } catch {
    return "Route registry unavailable.";
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = (await req.json()) as RequestBody;
  const routesData = loadRoutes();

  const systemPrompt = SYSTEM_PROMPT.replace("ROUTES_DATA", routesData) + `\n\n## Current Case\n` +
    (body.sourceUrl ? `- Source URL: ${body.sourceUrl}\n` : "") +
    (body.sourceDomain ? `- Source domain: ${body.sourceDomain}\n` : "") +
    (body.evidenceDescription ? `- Evidence: ${body.evidenceDescription}\n` : "") +
    `\n${LEGAL_FRAMEWORK}`;

  const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...body.messages.slice(-15),
  ];

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      stream: true,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const errObj = err as { status?: number; error?: { message?: string } };
    if (errObj?.status === 400) {
      return new Response(
        JSON.stringify({ error: "Context too large. Please start a new conversation." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const msg = err instanceof Error ? err.message : "Groq API error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
