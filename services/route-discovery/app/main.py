from fastapi import FastAPI


app = FastAPI(
    title="LeakOps Route Discovery",
    description="Resolves report routes, required fields, and escalation paths.",
)


@app.get("/")
async def read_root() -> dict[str, object]:
    return {
        "service": "route-discovery",
        "status": "ok",
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
