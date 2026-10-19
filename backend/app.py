
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.analytics import (
    get_dashboard_summary,
    get_dataset_info,
    VALID_SAMPLES,
)

app = FastAPI(
    title="RetailSense API",
    description="Customer Experience Intelligence backend",
    version="1.0.0",
)

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "dataset": get_dataset_info(),
    }


@app.get("/api/dashboard")
def dashboard(sample: str = "random"):
    if sample not in VALID_SAMPLES:
        raise HTTPException(
            status_code=422,
            detail="Invalid sample. Choose random, enriched or all."
        )

    return get_dashboard_summary(sample)


from fastapi import Query
from backend.analytics import get_dashboard_reviews


@app.get("/api/dashboard/reviews")
def dashboard_reviews(
    sample: str = "random",
    sentiment: str | None = None,
    category: str | None = None,
    scope: str = "Complaints",
    priority: str | None = None,
    flagged: bool | None = None,
):
    if sample not in VALID_SAMPLES:
        raise HTTPException(422, "Invalid sample.")

    try:
        return get_dashboard_reviews(
            sample=sample,
            sentiment=sentiment,
            category=category,
            scope=scope,
            priority=priority,
            flagged=flagged,
        )
    except ValueError as error:
        raise HTTPException(422, str(error))


@app.get("/api/dashboard/reviews/by-ids")
def dashboard_reviews_by_ids(
    ids: str = Query(...),
    sample: str = "random",
):
    if sample not in VALID_SAMPLES:
        raise HTTPException(422, "Invalid sample.")

    try:
        requested_ids = [
            int(item.strip())
            for item in ids.split(",")
            if item.strip()
        ]
    except ValueError:
        raise HTTPException(422, "Invalid review IDs.")

    if not requested_ids or len(requested_ids) > 150:
        raise HTTPException(422, "Provide 1–150 review IDs.")

    return get_dashboard_reviews(
        sample=sample,
        ids=requested_ids,
    )
