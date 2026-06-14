export type CaseType = "ncii_leak";

export type AgentStatus = "pending" | "running" | "complete";

export type RouteType = "form" | "email" | "support_portal" | "manual_review";

export type WorkflowPhase = {
  id: string;
  label: string;
  summary: string;
};

export type AgentCard = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  confidence: number;
  output: string;
};

export type RouteRecord = {
  domain: string;
  platformName: string;
  category: string;
  routeType: RouteType;
  reportUrl: string;
  contactEmail: string | null;
  requiredFields: string[];
  confidence: number;
};

export const workflowPhases: WorkflowPhase[] = [
  {
    id: "report",
    label: "Report",
    summary: "Submit an image, screenshot, or URL and set the case context.",
  },
  {
    id: "investigate",
    label: "Investigate",
    summary: "Agents extract evidence, identify platforms, and discover live routes.",
  },
  {
    id: "prepare",
    label: "Prepare",
    summary: "The system packages the complaint, required fields, and notices.",
  },
  {
    id: "respond",
    label: "Respond",
    summary: "Use the action packet, track submissions, and escalate if needed.",
  },
];

export const intakeModes = [
  "Leaked intimate image",
] as const;

export const agentCards: AgentCard[] = [
  {
    id: "intake",
    name: "Intake Agent",
    role: "Classifies the case and selects the response track.",
    status: "complete",
    confidence: 0.93,
    output: "Classified as NCII leak with platform evidence present in the screenshot.",
  },
  {
    id: "evidence",
    name: "Evidence Agent",
    role: "Extracts OCR text, hashes, timestamps, and artifact notes.",
    status: "complete",
    confidence: 0.9,
    output: "Captured visible username, post timestamp, and a unique media fingerprint.",
  },
  {
    id: "platform",
    name: "Platform Detection Agent",
    role: "Determines likely platform, domain, and abuse surface.",
    status: "running",
    confidence: 0.82,
    output: "Matching UI patterns against known adult-forum and file-host signatures.",
  },
  {
    id: "route-discovery",
    name: "Route Discovery Agent",
    role: "Discovers DMCA, takedown, abuse, and legal reporting paths.",
    status: "running",
    confidence: 0.76,
    output: "Checking footer, legal, and support links to map the highest-confidence removal route.",
  },
  {
    id: "notice",
    name: "Notice Agent",
    role: "Drafts short-form complaints, formal notices, and escalation copy.",
    status: "pending",
    confidence: 0.0,
    output: "Waiting for route details and policy framing.",
  },
  {
    id: "escalation",
    name: "Escalation Agent",
    role: "Builds fallback actions when the platform route is weak or missing.",
    status: "pending",
    confidence: 0.0,
    output: "Will prepare host, registrar, and cybercrime escalation paths if needed.",
  },
];

export const seedRoutes: RouteRecord[] = [
  {
    domain: "exampletube.com",
    platformName: "ExampleTube",
    category: "adult_tube",
    routeType: "form",
    reportUrl: "https://exampletube.com/legal/takedown",
    contactEmail: null,
    requiredFields: ["content_url", "email", "reason", "supporting_details"],
    confidence: 0.94,
  },
  {
    domain: "forummirror.net",
    platformName: "ForumMirror",
    category: "forum",
    routeType: "email",
    reportUrl: "mailto:abuse@forummirror.net",
    contactEmail: "abuse@forummirror.net",
    requiredFields: ["content_url", "reporter_name", "email", "description"],
    confidence: 0.78,
  },
];
