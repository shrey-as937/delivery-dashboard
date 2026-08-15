# Project Delivery Dashboard

A hackathon-ready internal/customer delivery dashboard: projects, milestones, tasks, issues,
and a Gemini-parsed update feed, with a live-demo-friendly "Internal View" / "Customer View"
toggle that changes what data is visible.

Tested end-to-end in this environment: backend seeds 4 mock projects, all endpoints verified
via curl, and the frontend passes a full TypeScript type-check. The only thing not verified
here is `next build`'s font fetch, which needs to reach `fonts.googleapis.com` — that's blocked
in this sandbox but will work fine on your machine.

## 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set GEMINI_API_KEY=your_key_here
# (the app still runs and demos fine without a key — /api/updates/parse
#  falls back to a simple truncated summary if Gemini isn't configured)

python seed.py                  # populates app.db with 4 mock projects
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to confirm all endpoints return correct JSON before
touching the frontend.

## 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points the app at http://localhost:8000
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/projects`.

## 3. Demo flow

1. `/projects` — grid of 4 projects, color-coded status badges, owner avatars.
2. Click a project — see milestones with nested tasks, and an issues panel grouped by
   category (Bug, Feature Request, Question, Support, Implementation).
3. Toggle **Internal View / Customer View** in the top right — issues and updates marked
   internal-only disappear, the "Log update" composer disappears, task-owner and due-date
   detail thins out, and the layout tightens up for a cleaner customer-facing look.
4. In Internal View, type a raw note into the composer (e.g. *"shipped the eligibility
   check integration, milestone is now done"*) and hit **Log update** — it's sent to
   `POST /api/updates/parse`, parsed by Gemini into a clean one-line summary plus an
   optional status-change tag, saved, and the feed refetches.
5. Uncheck "Visible to customer" before logging an update to see it appear only in
   Internal View, with an "Internal only" tag.

## Notes

- `GET /api/projects/{id}/stale-check` (used to show the "No update in 5+ days" badge on
  the project header in Internal View) returns `stale: true` if the newest `UpdateEntry`
  is older than 5 days or none exist.
- All view-based filtering (`view=internal|customer`) happens server-side in FastAPI, not
  in the frontend — the customer-view API response never contains internal-only rows.
- The Gemini call is wrapped in try/except in `backend/main.py::call_gemini_parse` so a
  missing key, network hiccup, or malformed JSON response never hard-fails the demo — it
  falls back to a truncated version of the raw text.
