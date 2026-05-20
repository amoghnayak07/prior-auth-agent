# Prior Auth Agent

Turn a clinical-notes PDF into a draft prior authorization letter in seconds. Upload a PDF, fill in the patient and insurer details, and the app extracts the text, runs it through an LLM, and returns a formal letter, a clinical summary, and the relevant ICD-10 codes.

## Stack

- **Frontend:** Vite + React + Tailwind CSS
- **Backend:** FastAPI (Python 3.11+)
- **LLM:** Groq (`llama-3.3-70b-versatile`) with JSON mode
- **PDF parsing:** `pypdf`

## Setup

You'll need Python 3.11+ and Node 20+ on your machine, plus a free [Groq API key](https://console.groq.com/keys).

### Backend

```powershell
cd backend
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (cmd):
# .venv\Scripts\activate.bat
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env            # PowerShell / cmd
# cp .env.example .env            # macOS / Linux
# then put your key in .env: GROQ_API_KEY=gsk_...
```

Run the API from inside `backend/` with the venv active:

```bash
uvicorn main:app --reload --port 8000
```

(Or without activating: `.venv\Scripts\uvicorn.exe main:app --reload --port 8000` on Windows.)

`GET http://localhost:8000/health` should return `{"status":"ok"}`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves on `http://localhost:5173` and proxies `/api/*` to the backend on `:8000`, so you can run both servers and use the app end-to-end with no extra config.

## Architecture

```
┌──────────────┐       multipart/form-data       ┌──────────────┐
│  React UI    │ ──────────────────────────────▶ │  FastAPI     │
│  (Vite :5173)│   POST /api/authorize           │  (:8000)     │
└──────────────┘                                  └──────┬───────┘
       ▲                                                 │
       │                                                 ▼
       │                                          ┌──────────────┐
       │                                          │  pypdf       │
       │                                          │  (text       │
       │                                          │   extraction)│
       │                                          └──────┬───────┘
       │                                                 ▼
       │                                          ┌──────────────┐
       │   { letter, icd_codes, summary }         │  Groq        │
       │ ◀──────────────────────────────────────  │  (JSON mode) │
       │                                          └──────────────┘
```

1. The UI submits the PDF + patient/insurer/diagnosis form fields to `POST /api/authorize`.
2. FastAPI gates the request (PDF mime type, ≤10 MB), then `pypdf` extracts the text and strips control characters.
3. The extracted text and form fields are sent to Groq with a strict JSON-mode prompt.
4. The route validates the response shape and returns `{ letter, icd_codes, summary }` to the UI.

Errors are surfaced as structured JSON (`{ error, detail }`) with appropriate status codes (400 for bad inputs, 413 for oversized uploads, 502 for upstream LLM failures).

## Why This Matters

Prior authorization is the manual approval step where clinicians submit paperwork to insurers before a treatment is covered. It is a roughly **$13B/year administrative burden** in the U.S. — the average physician practice spends ~14 hours per provider per week on these requests, and patients routinely face days of delay while letters are drafted, faxed, and reviewed. Most of the work is rote: pull clinical evidence from notes, cite the diagnosis codes, and write a formal letter to the insurer.

This project is a proof-of-concept that the drafting step is largely automatable: an LLM can read a clinical note and produce a passable first draft for a clinician to review, edit, and send — collapsing minutes of typing into seconds.

## Deployment

The backend is designed to deploy to Render and the frontend to Vercel. Live URLs and deployment notes will be added once Phase 6 lands.
