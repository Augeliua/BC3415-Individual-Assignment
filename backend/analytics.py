
from pathlib import Path
import pandas as pd

# Locate the dataset relative to the project,
# regardless of where the server is launched.
DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "retailsense_dashboard.csv"
)

ISSUE_CATEGORIES = [
    "Product Defect",
    "Material / Quality",
    "Sizing / Fit",
    "Misdelivery",
]

VALID_SAMPLES = {
    "random": "Random",
    "enriched": "Enriched",
    "all": None,
}


def load_dashboard_data():
    """Load precomputed RetailSense analysis results."""
    data = pd.read_csv(DATA_PATH)

    required = [
        "Original_Index",
        "Sample_Type",
        "Review Text",
        "Sentiment",
        "Priority",
        "Clothing ID",
        "Class Name",
    ]

    required += [
        f"Integrated_{category}"
        for category in ISSUE_CATEGORIES
    ]

    missing = [
        column for column in required
        if column not in data.columns
    ]

    if missing:
        raise ValueError(
            f"Missing dashboard columns: {missing}"
        )

    return data


dashboard_data = load_dashboard_data()


def filter_sample(sample="random"):
    if sample not in VALID_SAMPLES:
        raise ValueError("Invalid sample.")

    selected = VALID_SAMPLES[sample]

    if selected is None:
        return dashboard_data.copy()

    return dashboard_data[
        dashboard_data["Sample_Type"] == selected
    ].copy()


def get_dataset_info():
    return {
        "total_reviews": len(dashboard_data),
        "random_reviews": int(
            (dashboard_data["Sample_Type"] == "Random").sum()
        ),
        "enriched_reviews": int(
            (dashboard_data["Sample_Type"] == "Enriched").sum()
        ),
        "unique_products": int(
            dashboard_data["Clothing ID"].nunique()
        ),
        "product_categories": int(
            dashboard_data["Class Name"].nunique()
        ),
    }


def get_dashboard_summary(sample="random"):
    """Generate dashboard metrics from saved AI predictions."""
    data = filter_sample(sample)
    total = len(data)

    # A review is flagged if at least one issue is a complaint (2)
    complaint_columns = [
        f"Integrated_{category}"
        for category in ISSUE_CATEGORIES
    ]
    complaints = data[complaint_columns].eq(2)

    flagged = complaints.any(axis=1)

    # High priority: Product Defect or Misdelivery complaint
    high_priority = (
        complaints["Integrated_Product Defect"]
        | complaints["Integrated_Misdelivery"]
    )

    positive = data["Sentiment"].eq("Positive").sum()

    kpis = {
        "Reviews Analysed": total,
        "Reviews Flagged": int(flagged.sum()),
        "High-Priority Cases": int(high_priority.sum()),
        "Positive Sentiment %": (
            round(positive / total * 100, 1) if total else 0
        ),
    }

    sentiment = {
        name: int(data["Sentiment"].eq(name).sum())
        for name in ["Positive", "Neutral", "Negative"]
    }

    breakdown = []

    for category in ISSUE_CATEGORIES:
        contexts = pd.to_numeric(
            data[f"Integrated_{category}"],
            errors="coerce"
        )

        for scope in ["Complaints", "All Mentions"]:
            mask = (
                contexts.eq(2)
                if scope == "Complaints"
                else contexts.isin([1, 2])
            )

            for name in ["Positive", "Neutral", "Negative"]:
                breakdown.append({
                    "Category": category,
                    "Scope": scope,
                    "Sentiment": name,
                    "Reviews": int(
                        (mask & data["Sentiment"].eq(name)).sum()
                    ),
                })

    sample_notes = {
        "random": (
            "Random development sample of 100 reviews. "
            "AI predictions are preliminary and may contain "
            "classification errors."
        ),
        "enriched": (
            "Issue-enriched development sample of 50 reviews. "
            "This intentionally contains more potential complaints "
            "and is not representative of overall prevalence."
        ),
        "all": (
            "Combined development sample of 150 reviews "
            "(100 random and 50 issue-enriched). "
            "This is not a representative retail-wide sample."
        ),
    }

    return {
        "sample": sample,
        "sample_size": total,
        "kpis": kpis,
        "sentiment": sentiment,
        "issue_breakdown": breakdown,
        "sample_note": sample_notes[sample],
    }


import ast
import json


def parse_list(value):
    """Convert CSV-serialized lists into Python lists."""
    if isinstance(value, list):
        return value
    if value is None or pd.isna(value):
        return []
    if not isinstance(value, str) or not value.strip():
        return []

    try:
        parsed = json.loads(value)
    except (ValueError, TypeError):
        try:
            parsed = ast.literal_eval(value)
        except (ValueError, SyntaxError):
            parsed = None

    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, str):
        return [parsed]
    if isinstance(value, str):
        return [part.strip() for part in value.split(";") if part.strip()]
    return []


def safe_text(value):
    return "" if pd.isna(value) else str(value)


def get_dashboard_reviews(
    sample="random",
    sentiment=None,
    category=None,
    scope="Complaints",
    priority=None,
    flagged=None,
    ids=None,
):
    """Return underlying reviews for dashboard drill-downs."""
    data = filter_sample(sample)

    if sentiment:
        data = data[data["Sentiment"] == sentiment]

    if priority:
        data = data[data["Priority"] == priority]

    complaint_columns = [
        f"Integrated_{cat}" for cat in ISSUE_CATEGORIES
    ]
    has_complaint = data[complaint_columns].eq(2).any(axis=1)

    if flagged is True:
        data = data[has_complaint]
    elif flagged is False:
        data = data[~has_complaint]

    if category:
        if category not in ISSUE_CATEGORIES:
            raise ValueError("Invalid issue category.")

        context = pd.to_numeric(
            data[f"Integrated_{category}"],
            errors="coerce"
        )

        if scope == "Complaints":
            data = data[context.eq(2)]
        elif scope == "All Mentions":
            data = data[context.isin([1, 2])]
        else:
            raise ValueError("Invalid issue scope.")

    if ids is not None:
        data = data[
            data["Original_Index"].isin(ids)
        ]

    records = []

    for _, row in data.iterrows():
        contexts = {
            cat: int(row[f"Integrated_{cat}"])
            if pd.notna(row[f"Integrated_{cat}"])
            else 0
            for cat in ISSUE_CATEGORIES
        }

        complaint_categories = [
            cat for cat, context in contexts.items()
            if context == 2
        ]

        records.append({
            "id": int(row["Original_Index"]),
            "review": safe_text(row["Review Text"]),
            "sentiment": safe_text(row["Sentiment"]),
            "priority": safe_text(row["Priority"]),
            "issue_contexts": contexts,
            "complaint_categories": complaint_categories,
            

"priority_reason": (
    "No complaint was detected, so this review does not require "
    "investigation under the current triage rules."
    if not complaint_categories
    else (
        "A Product Defect or Misdelivery complaint was detected, "
        "resulting in High investigation priority."
        if row["Priority"] == "High"
        else (
            "A Material / Quality or Sizing / Fit complaint was detected, "
            "resulting in Medium investigation priority."
            if row["Priority"] == "Medium"
            else "Complaint detected, but the priority requires verification."
        )
    )
),

            "evidence": parse_list(row.get("Evidence", None)),
            "suggested_actions": parse_list(
                row.get("Suggested Actions", None)
            ),
            "review_status": safe_text(
                row.get("Review Status", "AI Prediction")
            ),
            "sample_type": safe_text(row["Sample_Type"]),
        })

    return {
        "total": len(records),
        "reviews": records,
    }
