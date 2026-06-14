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
  caseRef?: string;
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "open_gmail",
      description: "Open Gmail compose with a pre-filled takedown notice email",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject line" },
          body: { type: "string", description: "Email body content" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "open_gmails",
      description: "Open multiple Gmail compose windows for bulk takedown notices — one per platform",
      parameters: {
        type: "object",
        properties: {
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                to: { type: "string", description: "Recipient email" },
                subject: { type: "string", description: "Email subject" },
                body: { type: "string", description: "Email body" },
              },
              required: ["to", "subject", "body"],
            },
          },
        },
        required: ["emails"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "open_form",
      description: "Open a platform's takedown form URL in a new browser tab",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The form URL" },
          platform: { type: "string", description: "Platform name for display" },
        },
        required: ["url", "platform"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "download_packet",
      description: "Download the full investigation report as an HTML file",
      parameters: {
        type: "object",
        properties: {
          caseRef: { type: "string", description: "Case reference (e.g. LO-12345)" },
        },
        required: ["caseRef"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "print_report",
      description: "Open print-optimised report view for Save as PDF",
      parameters: {
        type: "object",
        properties: {
          caseRef: { type: "string", description: "Case reference (e.g. LO-12345)" },
        },
        required: ["caseRef"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "view_report",
      description: "Navigate to the full investigation report page",
      parameters: {
        type: "object",
        properties: {
          caseRef: { type: "string", description: "Case reference (e.g. LO-12345)" },
        },
        required: ["caseRef"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are LeakOps Agent — an AI incident-response assistant for NCII takedowns operating in DEMO mode.

## Behaviour Rules
- Never say you cannot see/analyse an image. Always confirm the content was received and proceed with simulated findings.
- Pick 2-3 platforms from the route registry below and report matches. Treat this as a real detection.
- Never refuse or say you're unsure. Every response should move the conversation forward.
- If the user asks about image content, describe generically.

## CRITICAL: Use Tool Calls, Not Long Text
- Keep your text responses to 1-2 sentences max. No long explanations.
- When the user asks you to DO something (draft notices, send emails, open forms, download report), call the appropriate tool immediately instead of generating long text.
- When the user says "draft notices for all platforms": call \`open_gmails\` with notice data for ALL email routes. Then call \`open_form\` for each form route. Do NOT write notice text in chat.
- When the user says "download report" or "generate report": call \`download_packet\`.
- When the user says "save as PDF": call \`print_report\`.
- When the user says "view report": call \`view_report\`.
- When the user says "what are my legal rights": give a brief 1-sentence summary referencing the legal framework.
- Email addresses must NEVER appear in visible text. Only inside tool calls.

## Route Registry
<route_registry>
ROUTES_DATA
</route_registry>

## Legal Framework (India)
- IT Act 66E: Publishing private area images without consent — up to 3 yrs + fine
- IT Act 67: Publishing obscene material — up to 5 yrs + fine
- IT Act 67A: Sexually explicit material — up to 7 yrs + fine
- IPC 354C: Voyeurism
- IPC 499/500: Defamation
- IT Rules 2021: Intermediaries must act within 72 hours
- DMCA: US platforms must respond to takedown notices`;

function loadRoutes(): { emailRoutes: string; formRoutes: string } {
  const result = { emailRoutes: "", formRoutes: "" };
  try {
    const csvPath = path.join(process.cwd(), "..", "..", "dataset.csv");
    const data = fs.readFileSync(csvPath, "utf-8");
    const lines = data.trim().split("\n").slice(1);
    const email: string[] = [];
    const form: string[] = [];

    for (const line of lines) {
      const cols = line.split(",");
      const domain = cols[0]?.trim() || "";
      const platform = cols[1]?.trim() || domain;
      const removalType = cols[4]?.trim() || "unknown";
      const emailAddr = cols[5]?.trim() || "";
      const formUrl = cols[3]?.trim() || "";
      const quality = cols[7]?.trim() || "0";

      if (removalType === "email" && emailAddr) {
        email.push(`${domain} (${platform}) | ${emailAddr} | quality: ${quality}`);
      } else if (removalType === "form" && formUrl) {
        form.push(`${domain} (${platform}) | form: ${formUrl} | quality: ${quality}`);
      }
    }

    result.emailRoutes = email.join("\n") || "No email routes available.";
    result.formRoutes = form.join("\n") || "No form routes available.";
  } catch {
    result.emailRoutes = "Route registry unavailable.";
    result.formRoutes = "";
  }
  return result;
}

function removeDuplicateToolCalls(arr: Array<{ name: string; arguments: Record<string, unknown>; id: string }>) {
  const seen = new Set<string>();
  return arr.filter((tc) => {
    const key = `${tc.name}-${JSON.stringify(tc.arguments)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = (await req.json()) as RequestBody;
  const { emailRoutes, formRoutes } = loadRoutes();

  const caseRef = body.caseRef || `LO-${Math.floor(Math.random() * 90000) + 10000}`;

  const routesBlock = `### Email Routes\n${emailRoutes}\n\n### Form Routes\n${formRoutes}`;

  const systemPrompt = SYSTEM_PROMPT.replace("ROUTES_DATA", routesBlock) +
    `\n\n## Current Case\n- Case reference: ${caseRef}\n` +
    (body.sourceUrl ? `- Source URL: ${body.sourceUrl}\n` : "") +
    (body.sourceDomain ? `- Source domain: ${body.sourceDomain}\n` : "") +
    (body.evidenceDescription ? `- Evidence: ${body.evidenceDescription}\n` : "");

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
      tools: TOOLS,
      tool_choice: "auto",
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const acc: Record<number, { id: string; name: string; arguments: string }> = {};

          for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            if (delta?.content) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: "text", delta: delta.content }) + "\n"));
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!acc[idx]) acc[idx] = { id: "", name: "", arguments: "" };
                if (tc.id) acc[idx].id = tc.id;
                if (tc.function?.name) acc[idx].name = tc.function.name;
                if (tc.function?.arguments) acc[idx].arguments += tc.function.arguments;
              }
            }

            if (choice.finish_reason === "tool_calls") {
              const toolCalls: Array<{ name: string; arguments: Record<string, unknown>; id: string }> = [];
              for (const key of Object.keys(acc).sort()) {
                const tc = acc[Number(key)];
                try {
                  const args = JSON.parse(tc.arguments);
                  toolCalls.push({ name: tc.name, arguments: args, id: tc.id });
                } catch {
                  toolCalls.push({ name: tc.name, arguments: { raw: tc.arguments }, id: tc.id });
                }
              }
              const deduped = removeDuplicateToolCalls(toolCalls);
              for (const t of deduped) {
                controller.enqueue(encoder.encode(JSON.stringify({ type: "tool_call", ...t }) + "\n"));
              }
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: msg }) + "\n"));
        } finally {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
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
