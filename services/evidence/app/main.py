from fastapi import FastAPI


app = FastAPI(
    title="LeakOps Evidence Service",
    description="Owns OCR extraction, hashing, and metadata normalization.",
)


@app.get("/")
async def read_root() -> dict[str, object]:
    return {
        "service": "evidence",
        "status": "ok",
        "capabilities": [
            "ocr-extraction",
            "hashing",
            "metadata-normalization",
            "artifact-summary",
        ],
    }


@app.get("/health")
async def read_health() -> dict[str, str]:
    return {"status": "healthy"}
