
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



from backend.analytics import get_available_filters

@app.get("/api/dashboard/filters")
def dashboard_filters():
    """Return available business filters."""
    return get_available_filters()


@app.get("/api/dashboard")
def dashboard(
    category: str | None = None,
    priority: str | None = None,
    sentiment: str | None = None,
):
    """Return filtered operational dashboard analytics."""
    try:
        return get_dashboard_summary(
            category=category,
            priority=priority,
            sentiment=sentiment,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))



from fastapi import Query
from backend.analytics import get_dashboard_reviews



@app.get("/api/dashboard/reviews")
def dashboard_reviews(
    clothing_category: str | None = None,
    dashboard_priority: str | None = None,
    dashboard_sentiment: str | None = None,
    sentiment: str | None = None,
    category: str | None = None,
    scope: str = "Complaints",
    priority: str | None = None,
    flagged: bool | None = None,
):
    try:
        return get_dashboard_reviews(
            clothing_category=clothing_category,
            dashboard_priority=dashboard_priority,
            dashboard_sentiment=dashboard_sentiment,
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
    clothing_category: str | None = None,
    dashboard_priority: str | None = None,
    dashboard_sentiment: str | None = None,
):
    try:
        requested_ids = [
            int(item.strip())
            for item in ids.split(",")
            if item.strip()
        ]
    except ValueError:
        raise HTTPException(422, "Invalid review IDs.")

    if not requested_ids or len(requested_ids) > 1500:
        raise HTTPException(422, "Provide 1–1500 review IDs.")

    try:
        return get_dashboard_reviews(
            clothing_category=clothing_category,
            dashboard_priority=dashboard_priority,
            dashboard_sentiment=dashboard_sentiment,
            ids=requested_ids,
        )
    except ValueError as error:
        raise HTTPException(422, str(error))



from backend.analytics import get_product_intelligence



@app.get("/api/dashboard/product-intelligence")
def product_intelligence(
    clothing_category: str | None = None,
    dashboard_priority: str | None = None,
    dashboard_sentiment: str | None = None,
):
    try:
        return get_product_intelligence(
            clothing_category=clothing_category,
            dashboard_priority=dashboard_priority,
            dashboard_sentiment=dashboard_sentiment,
        )
    except ValueError as error:
        raise HTTPException(422, str(error))



# RetailSense production frontend
from pathlib import Path
from fastapi.staticfiles import StaticFiles

FRONTEND_DIR = Path(__file__).resolve().parent / "static"

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIR, html=True),
    name="retailsense-frontend",
)
