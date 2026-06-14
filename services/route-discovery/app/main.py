import csv
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException

app = FastAPI(
    title="LeakOps Route Discovery",
    description="Resolves report routes, required fields, and escalation paths.",
)

DATA_PATH = Path(os.getenv("ROUTE_DISCOVERY_DATA_PATH", str(Path(__file__).resolve().parent.parent / "data" / "takedown-routes.csv")))
if not DATA_PATH.exists():
    DATA_PATH = Path(__file__).resolve().parent.parent.parent.parent / "dataset.csv"

_ROUTES: list[dict[str, str]] = []


def _load_csv() -> list[dict[str, str]]:
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row for row in reader]


def _get_routes() -> list[dict[str, str]]:
    global _ROUTES
    if not _ROUTES:
        _ROUTES = _load_csv()
    return _ROUTES


@app.on_event("startup")
async def startup() -> None:
    _get_routes()


@app.get("/")
async def read_root() -> dict[str, object]:
    return {
        "service": "route-discovery",
        "status": "ok",
        "routes_loaded": len(_get_routes()),
        "capabilities": [
            "seed-route-lookup",
            "live-route-discovery",
            "required-field-inference",
            "route-confidence",
        ],
    }


@app.get("/health")
async def read_health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/api/v1/routes")
async def list_routes(
    domain: str | None = None,
    limit: int = 50,
) -> list[dict[str, str]]:
    routes = _get_routes()
    if domain:
        domain_lower = domain.lower()
        routes = [r for r in routes if domain_lower in r.get("domain", "").lower()]
    return routes[:limit]


@app.get("/api/v1/routes/{domain}")
async def lookup_route(domain: str) -> dict[str, str]:
    routes = _get_routes()
    domain_lower = domain.lower()
    for r in routes:
        if r.get("domain", "").lower() == domain_lower:
            return r
    raise HTTPException(status_code=404, detail=f"No route found for domain: {domain}")


@app.get("/api/v1/routes/{domain}/submit")
async def route_submit_info(domain: str) -> dict[str, object]:
    route = await lookup_route(domain)
    removal_type = route.get("removal_type", "unknown")
    contact = route.get("contact_email", "")
    page_url = route.get("removal_page_url", "")

    if removal_type == "email" and contact:
        method: str = "email"
        target = f"mailto:{contact}"
        fields = ["subject", "content_url", "evidence_summary"]
    elif page_url and removal_type == "form":
        method = "form"
        target = page_url
        fields = ["content_url", "email", "reason", "description"]
    elif page_url:
        method = "form"
        target = page_url
        fields = ["content_url", "email", "reason", "description"]
    else:
        method = "manual_review"
        target = ""
        fields = ["domain", "evidence_summary", "operator_contact"]

    return {
        "domain": domain,
        "method": method,
        "target": target,
        "required_fields": fields,
        "confidence": min(100, int(route.get("data_quality", "1")) * 33),
    }
