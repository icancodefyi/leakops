# LeakOps

LeakOps is an agentic incident-response platform for NCII takedowns. The product takes a source link or evidence image and turns it into a case workspace with evidence preservation, route discovery, urgent action priority, and submission-ready takedown output.

## Product flow

1. `Report`
   Submit a leaked intimate-content link or supporting evidence image.
2. `Investigate`
   Run intake, evidence, platform detection, and route discovery agents against the takedown-route CSV.
3. `Prepare`
   Generate route details, required fields, notices, urgent actions, and escalation copy.
4. `Respond`
   Open the discovered route, submit the report, and track follow-up actions.

## Monorepo structure

- `apps/web`
  Next.js operator UI with the landing page, intake workspace, and case workspace.
- `services/orchestrator`
  FastAPI service for case state, sequencing, and agent handoffs.
- `services/route-discovery`
  FastAPI service for takedown route lookup and live route discovery.
- `services/evidence`
  FastAPI service for OCR, hashing, and artifact normalization.
- `packages/shared`
  Shared workflow types, seed data, and UI-facing contracts.

## Development

The intended root command is:

```bash
pnpm dev
```

That starts:

- `apps/web` on `:3000`
- `services/orchestrator` on `:4001`
- `services/route-discovery` on `:4002`
- `services/evidence` on `:4003`

## Current status

The monorepo structure, mock UI flow, CSV-backed route data, and FastAPI service shells are in place.
