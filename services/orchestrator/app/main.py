from fastapi import FastAPI


app = FastAPI(
    title="LeakOps Orchestrator",
    description="Coordinates case state, agent sequencing, and workflow handoffs.",
)


@app.get("/")
async def read_root() -> dict[str, object]:
    return {
        "service": "orchestrator",
        "status": "ok",
        "capabilities": [
            "case-state",
            "agent-sequencing",
            "handoff-tracking",
            "incident-summary",
        ],
    }


@app.get("/health")
async def read_health() -> dict[str, str]:
    return {"status": "healthy"}
