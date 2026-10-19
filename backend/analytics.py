
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


import re

# Specific customer concerns and suggested investigations
CONCERN_PATTERNS = {
    "Runs Small / Tight Fit": {
        "Category": "Sizing / Fit",
        "Patterns": [
            r"\bruns?\s+(?:very\s+|a\s+bit\s+)?small\b",
            r"\btoo\s+(?:tight|small|snug)\b",
            r"\btight\s+(?:around|in|on)\b",
            r"\bsize\s+up\b",
            r"\bconstricting\b",
        ],
        "Recommendation": (
            "Review garment measurements and sizing specifications. "
            "Consider updating size guidance or future production specifications."
        ),
    },
    "Runs Large / Loose Fit": {
        "Category": "Sizing / Fit",
        "Patterns": [
            r"\bruns?\s+(?:very\s+|a\s+bit\s+)?(?:large|big)\b",
            r"\btoo\s+(?:loose|big|large)\b",
            r"\bsize\s+down\b",
            r"\bbaggy\b",
        ],
        "Recommendation": (
            "Review garment measurements and fit consistency. "
            "Consider improving size guidance or adjusting future production specifications."
        ),
    },
    "Zipper / Fastener Failure": {
        "Category": "Product Defect",
        "Patterns": [
            r"\bzipper\b.*\b(?:broke|broken|stuck|failed)\b",
            r"\b(?:button|zipper)\b.*\b(?:fell|came)\s+off\b",
        ],
        "Recommendation": (
            "Inspect fastener durability and review component quality "
            "with relevant suppliers before future production."
        ),
    },
    "Stitching / Seam Failure": {
        "Category": "Product Defect",
        "Patterns": [
            r"\bstitch(?:ing|es)?\b.*\b(?:loose|broke|came|fell)\b",
            r"\bseam\b.*\b(?:split|ripped|torn|came)\b",
            r"\bcame\s+apart\b",
        ],
        "Recommendation": (
            "Investigate stitching durability and manufacturing "
            "quality-control specifications."
        ),
    },
    "Thin / Poor Fabric Quality": {
        "Category": "Material / Quality",
        "Patterns": [
            r"\b(?:too|very)\s+thin\b",
            r"\bsee.through\b",
            r"\bpoor\s+quality\b",
            r"\bcheap\s+(?:fabric|material|quality)\b",
            r"\bitchy\b|\bscratchy\b",
        ],
        "Recommendation": (
            "Review fabric specifications and material quality "
            "before considering changes to future product batches."
        ),
    },
    "Incorrect Item Delivered": {
        "Category": "Misdelivery",
        "Patterns": [
            r"\bwrong\s+(?:item|product|size|colou?r)\b",
            r"\breceived\s+(?:the\s+)?wrong\b",
        ],
        "Recommendation": (
            "Investigate order picking, packing and fulfilment accuracy."
        ),
    },
}

COMPILED_CONCERNS = {
    name: re.compile("|".join(config["Patterns"]), re.IGNORECASE)
    for name, config in CONCERN_PATTERNS.items()
}


def consolidate_feedback(data, group_column="Class Name", min_reviews=2):
    """Identify recurring concerns supported by complaint predictions and text."""
    records = []

    for group_name, group in data.groupby(group_column, dropna=True):
        for concern, config in CONCERN_PATTERNS.items():
            category = config["Category"]

            matches = group[
                group[f"Integrated_{category}"].eq(2)
                & group["Review Text"].fillna("").str.contains(
                    COMPILED_CONCERNS[concern],
                    regex=True
                )
            ]

            if len(matches) < min_reviews:
                continue

            records.append({
                "Group": group_name,
                "Concern": concern,
                "Issue Category": category,
                "Supporting Reviews": len(matches),
                "Group Reviews": len(group),
                "Recommendation": config["Recommendation"],
                "Review IDs": (
                    matches["Original_Index"].astype(int).tolist()
                ),
            })

    if not records:
        return pd.DataFrame(columns=[
            "Group", "Concern", "Issue Category",
            "Supporting Reviews", "Group Reviews",
            "Recommendation", "Review IDs",
        ])

    return pd.DataFrame(records).sort_values(
        ["Supporting Reviews", "Group", "Concern"],
        ascending=[False, True, True]
    )


def get_product_intelligence(sample="random"):
    """Format recurring concern patterns for the React dashboard."""
    data = filter_sample(sample)

    category_findings = consolidate_feedback(
        data, group_column="Class Name", min_reviews=2
    )
    product_findings = consolidate_feedback(
        data, group_column="Clothing ID", min_reviews=2
    )

    def format_findings(frame, level):
        findings = []

        for _, row in frame.iterrows():
            findings.append({
                "level": level,
                "group": (
                    int(row["Group"])
                    if level == "product"
                    else str(row["Group"])
                ),
                "concern": row["Concern"],
                "issue_category": row["Issue Category"],
                "supporting_reviews": int(row["Supporting Reviews"]),
                "group_reviews": int(row["Group Reviews"]),
                "recommendation": row["Recommendation"],
                "review_ids": [
                    int(value) for value in row["Review IDs"]
                ],
            })

        return findings

    return {
        "sample": sample,
        "sample_size": len(data),
        "category_insights": format_findings(
            category_findings, "category"
        ),
        "product_insights": format_findings(
            product_findings, "product"
        ),
        "note": (
            "Preliminary patterns from AI-detected complaints "
            "and keyword matching; not confirmed product defects."
        ),
    }
