
# RetailSense — AI-Powered Customer Experience Intelligence

**BC3415 Individual Assignment | Option A: Coding**

**Live Application:** https://retailsense-api-u6yw.onrender.com/

## 1. Project Overview

RetailSense is an AI-powered customer experience intelligence application designed to analyse women's clothing reviews and help retailers identify recurring customer concerns, prioritise complaints, and make informed business decisions.

The project combines sentiment classification, hybrid complaint detection, explainable prioritisation, and interactive retail analytics.

RetailSense consists of two components:

1. **Google Colab NLP Pipeline:** Develops and evaluates sentiment classification models, detects product-related complaints, assigns priorities, and generates review-level predictions.
2. **RetailSense Web Application:** Uses React and FastAPI to present AI-generated insights through an interactive dashboard.

**End-to-end workflow:**

Raw Customer Reviews → Data Preprocessing → Sentiment Classification → Complaint Detection → Priority Assignment → Operational Predictions → Retail Intelligence Dashboard

**Deployment scope:** The deployed application displays previously generated predictions from the trained NLP models. Transformer inference is performed offline in Google Colab rather than live on Render.

## 2. Live Application

**Access RetailSense:** https://retailsense-api-u6yw.onrender.com/

The dashboard analyses **1,500 historical customer reviews**, covering **319 clothing IDs** and **20 product classes**.

### Key Features

**Customer Experience Overview**
- Reviews analysed, reviews flagged, high-priority cases, and positive sentiment rate.
- Interactive sentiment distribution and issue-category charts.
- Business filters for product category, complaint priority, and sentiment.

**Review Explorer**
- Searchable customer reviews with detailed predictions.
- Detected complaint categories and supporting evidence.
- Explainable priority assignments and suggested actions.
- Interactive drill-downs from KPIs, charts, and recurring concerns.

**Product Intelligence**
- Consolidates recurring customer concerns by clothing category and individual product ID.
- Identifies text-supported patterns, such as sizing inconsistencies or construction concerns.
- Supports searching, sorting, and expanding findings.
- Links each concern to its supporting customer reviews.

### Operational Dataset Summary

| Metric | Value |
|---|---:|
| Reviews analysed | 1,500 |
| Reviews flagged | 598 |
| High-priority reviews | 81 |
| Positive reviews | 1,063 |
| Neutral reviews | 291 |
| Negative reviews | 146 |
| Unique clothing IDs | 319 |
| Product classes | 20 |

These statistics describe the historical demonstration sample, not a live retailer's complete customer base.

## 3. Dataset Preparation

The project uses the **Women's Clothing E-Commerce Reviews** dataset.

- Original dataset: 23,486 records.
- Cleaned dataset: 22,634 usable reviews.
- Preprocessing includes missing-value assessment, cleaning, sentiment labelling, and exploratory data analysis.
- Data splitting is performed for model development and evaluation.

Additional annotated datasets support exploratory complaint detection and contextual evaluation.

## 4. NLP Methodology

### 4.1 Sentiment Classification

The project compares baseline and advanced approaches before selecting a fine-tuned **DistilBERT** sentiment classifier.

Each review is classified into one of three categories:

- Negative
- Neutral
- Positive

The Colab notebook includes model experimentation, evaluation metrics, comparisons, and error analysis.

### 4.2 Hybrid Product-Issue Detection

RetailSense combines complementary NLP techniques to identify product-related complaints.

| Method | Purpose |
|---|---|
| MPNet sentence embeddings | Semantic detection of Product Defect and Sizing / Fit contexts |
| Rule-based detection | Identification of Material / Quality and Misdelivery cues |
| BART-large-MNLI | Contextual refinement of detected complaints |

Four complaint categories are supported:

1. Product Defect
2. Material / Quality
3. Sizing / Fit
4. Misdelivery

Detected issues are preliminary AI-generated signals, not independently verified product defects.

### 4.3 Explainable Complaint Prioritisation

RetailSense uses interpretable business rules to classify complaints by priority.

| Priority | Criteria |
|---|---|
| High | Product Defect or Misdelivery complaint |
| Medium | Sizing / Fit or Material / Quality complaint without a high-priority trigger |
| No Priority | No qualifying complaint detected |

The system also provides supporting evidence, priority explanations, suggested follow-up actions, and sentiment–complaint mismatch indicators.

A positive review can still contain a specific complaint requiring investigation.

### 4.4 Operational Inference

The trained NLP pipeline processes a separate historical sample of 1,500 reviews.

Predictions are exported to:

`data/retailsense_operational.csv`

The FastAPI backend aggregates these predictions into dashboard metrics, complaint distributions, review-level details, and recurring product concerns.

## 5. System Architecture

```text
                    GOOGLE COLAB
                    ------------
                    Raw Reviews
                         |
                  Data Preprocessing
                         |
                  Sentiment Modelling
                    (DistilBERT)
                         |
                  Complaint Detection
                 (MPNet + Rules + BART)
                         |
                  Explainable Triage
                         |
                  Operational Dataset
                         |
                         v
               retailsense_operational.csv
                         |
                         v
                    FASTAPI BACKEND
                    ---------------
                  Filtering & Analytics
                  Product Intelligence
                  Review-Level Evidence
                         |
                         v
                    REACT FRONTEND
                    --------------
                  RetailSense Dashboard
                  Interactive Visualisations
                  Review Explorer
                  Product Intelligence
                         |
                         v
                       RENDER
                  Live Web Application
```

**Architecture note:** The large transformer models run offline in Colab. The deployed web application uses their saved predictions, allowing lightweight hosting without GPU inference.

## 6. Repository Structure

```text
BC3415-Individual-Assignment/
|
|-- backend/
|   |-- app.py
|   |-- analytics.py
|   |-- requirements.txt
|   |-- static/
|
|-- data/
|   |-- retailsense_operational.csv
|   |-- retailsense_dashboard.csv
|
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |-- package.json
|   |-- vite.config.js
|
|-- README.md
```

The cleaned Colab notebook, `RetailSense_Final_Submission.ipynb`, contains the model-development, evaluation, and offline inference workflow. It should be included in the repository or submitted separately according to the assignment instructions.

## 7. Running RetailSense Locally

### Requirements

- Python 3.10 or later
- Node.js and npm

### Step 1: Install Backend Dependencies

From the repository root:

```bash
python -m pip install -r backend/requirements.txt
```

### Step 2: Start FastAPI

```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Start React

Open another terminal:

```bash
cd frontend
npm ci --legacy-peer-deps
npm run dev -- --host 0.0.0.0
```

Open:

http://localhost:5173

The Vite development server forwards `/api` requests to FastAPI on port 8000.

### Production Deployment

The React frontend is compiled using:

```bash
cd frontend
npm run build
```

The generated files in `frontend/dist/` are copied into `backend/static/`.

FastAPI serves the compiled React application and API endpoints together through one Render web service.

**Live URL:** https://retailsense-api-u6yw.onrender.com/

## 8. Reproducing the NLP Pipeline

Open `RetailSense_Final_Submission.ipynb` in Google Colab.

A GPU runtime is recommended because transformer training and large-scale inference are computationally intensive.

### Required Input Files

Upload the following files into `/content/`:

| File | Purpose |
|---|---|
| `Womens Clothing E-Commerce Reviews.csv.zip` | Original customer reviews |
| `retailsense_context_annotated_draft.csv` | Contextual complaint annotations |
| `retailsense_exploratory_labels.csv` | Exploratory complaint evaluation labels |

Run the notebook in sequence to reproduce:

1. Dataset preparation and exploratory analysis.
2. Sentiment model experimentation and evaluation.
3. Hybrid product-issue detection.
4. Explainable complaint prioritisation.
5. Reusable NLP inference pipeline.
6. Operational dataset generation and validation.

Intermediate model checkpoints and generated predictions are created during execution.

A fresh end-to-end run may require substantial GPU time.

## 9. Alignment with BC3415 Assessment Criteria

| Assessment Criterion | Project Evidence |
|---|---|
| Model Accuracy & Performance | Model comparison, quantitative evaluation, error analysis, and final model selection |
| Data Preprocessing | Data quality assessment, cleaning, sentiment labelling, exploratory analysis, and dataset splitting |
| Explainability & Commentary | NLP methodology, supporting evidence, priority explanations, technical decisions, and limitations |
| Creativity in Combining Text-Based Insights | Hybrid complaint detection, sentiment–complaint mismatch analysis, recurring issue consolidation, and actionable product intelligence |
| Usability & Reusability | Reusable inference pipeline, FastAPI endpoints, interactive dashboard, business filtering, review drill-downs, and deployed application |

## 10. Limitations

**Historical Data:** The public dashboard presents predictions generated from a historical review sample, rather than analysing new customer reviews in real time.

**Model Uncertainty:** Sentiment classification and complaint detection may generate incorrect predictions. AI-generated findings should be validated before operational decisions are made.

**Complaint Interpretation:** Repeated issue descriptions may reflect different underlying circumstances across product categories or clothing IDs.

**Dataset Scope:** Dashboard metrics represent a selected 1,500-review sample and should not be generalised to the full dataset or interpreted as chronological trends.

**Hosting Constraints:** The transformer-based NLP pipeline runs separately from the lightweight deployed dashboard to reduce hosting requirements.

## 11. Technology Stack

| Component | Technologies |
|---|---|
| NLP and Machine Learning | Python, Hugging Face Transformers, DistilBERT, MPNet, BART-large-MNLI |
| Data Processing | Pandas, rule-based text processing |
| Backend | FastAPI, Python |
| Frontend | React, Vite, Recharts |
| Model Development | Google Colab |
| Version Control | GitHub |
| Deployment | Render |

---

**Academic Project Notice:** RetailSense is a proof-of-concept customer experience intelligence application. AI-generated insights support human interpretation and decision-making and should not be treated as independently verified product defects.
