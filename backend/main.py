import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models import (
    Issue,
    Milestone,
    Owner,
    Project,
    SessionLocal,
    Task,
    UpdateEntry,
    init_db,
)
from seed import seed_if_empty

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI(title="Project Delivery Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    seed_if_empty()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def view_param(view: str = Query("internal", pattern="^(internal|customer)$")):
    return view


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def serialize_owner(owner: Owner):
    return {"id": owner.id, "name": owner.name, "type": owner.type.value}


def serialize_task(task: Task):
    return {
        "id": task.id,
        "name": task.name,
        "status": task.status.value,
        "owner": serialize_owner(task.owner) if task.owner else None,
    }


def serialize_milestone(milestone: Milestone):
    return {
        "id": milestone.id,
        "name": milestone.name,
        "status": milestone.status.value,
        "due_date": milestone.due_date.isoformat() if milestone.due_date else None,
        "tasks": [serialize_task(t) for t in milestone.tasks],
    }


def serialize_issue(issue: Issue):
    return {
        "id": issue.id,
        "title": issue.title,
        "category": issue.category.value,
        "status": issue.status.value,
        "is_customer_visible": issue.is_customer_visible,
    }


def serialize_update(update: UpdateEntry):
    return {
        "id": update.id,
        "raw_text": update.raw_text,
        "parsed_summary": update.parsed_summary,
        "status_change": update.status_change,
        "timestamp": update.timestamp.isoformat(),
        "is_customer_visible": update.is_customer_visible,
    }


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "customer_name": p.customer_name,
            "status": p.status.value,
            "owners": [{"name": o.name} for o in p.owners],
        }
        for p in projects
    ]


@app.get("/api/projects/{project_id}")
def get_project(project_id: int, view: str = Depends(view_param), db: Session = Depends(get_db)):
    project = get_project_or_404(db, project_id)

    return {
        "id": project.id,
        "name": project.name,
        "customer_name": project.customer_name,
        "status": project.status.value,
        "owners": [serialize_owner(o) for o in project.owners],
        "milestones": [serialize_milestone(m) for m in project.milestones],
        "view": view,
    }


@app.get("/api/projects/{project_id}/issues")
def get_project_issues(project_id: int, view: str = Depends(view_param), db: Session = Depends(get_db)):
    get_project_or_404(db, project_id)

    query = db.query(Issue).filter(Issue.project_id == project_id)
    if view == "customer":
        query = query.filter(Issue.is_customer_visible == True)  # noqa: E712

    issues = query.all()

    grouped: dict[str, list] = {}
    for issue in sorted(issues, key=lambda i: i.category.value):
        grouped.setdefault(issue.category.value, []).append(serialize_issue(issue))

    return {"view": view, "issues_by_category": grouped, "total": len(issues)}


@app.get("/api/projects/{project_id}/updates")
def get_project_updates(project_id: int, view: str = Depends(view_param), db: Session = Depends(get_db)):
    get_project_or_404(db, project_id)

    query = db.query(UpdateEntry).filter(UpdateEntry.project_id == project_id)
    if view == "customer":
        query = query.filter(UpdateEntry.is_customer_visible == True)  # noqa: E712

    updates = query.order_by(UpdateEntry.timestamp.desc()).all()
    return {"view": view, "updates": [serialize_update(u) for u in updates]}


class ParseUpdateRequest(BaseModel):
    project_id: int
    raw_text: str
    is_customer_visible: bool = True


GEMINI_PROMPT_TEMPLATE = """You are parsing an informal project-update note written by a delivery/customer-success team member into structured data.

Raw note:
\"\"\"{raw_text}\"\"\"

Return ONLY valid JSON (no markdown fences, no preamble, no explanation) with exactly these two keys:
- "parsed_summary": a clean, professional one-line summary of the update (max ~25 words)
- "status_change": if the note implies a milestone or task changed status (e.g. "now done", "is blocked", "moved to open"), a short string like "Milestone Name -> status". If no status change is implied, use null.

Example output:
{{"parsed_summary": "Telemetry ingestion milestone completed after load testing.", "status_change": "Fleet telemetry ingestion -> done"}}
"""


def call_gemini_parse(raw_text: str) -> dict:
    """Calls Gemini to parse raw_text into {parsed_summary, status_change}.
    Raises on any failure so the caller can fall back gracefully."""
    from google import genai

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = GEMINI_PROMPT_TEMPLATE.format(raw_text=raw_text)

    # Attempt gemini-2.5-flash as specified, fallback to available flash models
    models_to_try = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest"]
    response = None
    last_err = None

    for m in models_to_try:
        try:
            response = client.models.generate_content(
                model=m,
                contents=prompt,
            )
            if response and response.text:
                break
        except Exception as e:
            last_err = e
            continue

    if response is None or not response.text:
        if last_err:
            raise last_err
        raise ValueError("Empty response from Gemini")

    text = (response.text or "").strip()
    # Strip accidental markdown fences just in case
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()

    data = json.loads(text)
    if "parsed_summary" not in data:
        raise ValueError("Gemini response missing parsed_summary")
    return data


@app.post("/api/updates/parse")
def parse_update(payload: ParseUpdateRequest, db: Session = Depends(get_db)):
    get_project_or_404(db, payload.project_id)

    parsed_summary = None
    status_change = None

    try:
        result = call_gemini_parse(payload.raw_text)
        parsed_summary = result.get("parsed_summary")
        status_change = result.get("status_change")
    except Exception:
        # Fallback so the demo never hard-fails even if Gemini/API key has an issue
        truncated = payload.raw_text.strip().replace("\n", " ")
        parsed_summary = (truncated[:117] + "...") if len(truncated) > 120 else truncated
        status_change = None

    entry = UpdateEntry(
        project_id=payload.project_id,
        raw_text=payload.raw_text,
        parsed_summary=parsed_summary,
        status_change=status_change,
        timestamp=datetime.now(timezone.utc),
        is_customer_visible=payload.is_customer_visible,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return serialize_update(entry)


@app.get("/api/projects/{project_id}/stale-check")
def stale_check(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(db, project_id)

    latest = (
        db.query(UpdateEntry)
        .filter(UpdateEntry.project_id == project_id)
        .order_by(UpdateEntry.timestamp.desc())
        .first()
    )

    if latest is None:
        return {"stale": True, "last_update_at": None}

    now = datetime.now(timezone.utc)
    ts = latest.timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    is_stale = ts < (now - timedelta(days=5))
    return {"stale": is_stale, "last_update_at": latest.timestamp.isoformat()}
