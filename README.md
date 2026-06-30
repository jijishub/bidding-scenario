# BiddingScenario

A sci-fi auction simulation ported from a legacy C# console program into a decoupled web app. The backend runs a strict state-machine replica of the original bidding logic; the frontend renders it as a glassmorphism terminal with a character-by-character typing effect.

**Stack:** FastAPI · SQLite (Turso-ready) · React 19 · TypeScript · Tailwind CSS v4 · Vite 8

**Deployment targets:** Fly.io (backend) · Vercel (frontend)

---

## Project Structure

```
BiddingScenario/
├── backend/
│   ├── main.py                  # FastAPI app — /session + /session/{id}/step
│   ├── requirements.txt
│   └── app/
│       ├── models.py            # Pydantic schemas
│       ├── state_machine.py     # Full auction logic (C# parity)
│       ├── session_store.py     # SQLite persistence (swap 2 lines for Turso)
│       └── stars.py             # Star field generator
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Session lifecycle + typing queue
│   │   ├── Teleprompter.tsx     # Glassmorphism panel + star background
│   │   ├── api.ts               # createSession / sendStep
│   │   ├── types.ts             # Shared TypeScript interfaces
│   │   └── components/
│   │       ├── MessageLog.tsx   # Typing animation
│   │       ├── InputArea.tsx    # Context-aware input (text/choice/continue/done)
│   │       └── StarField.tsx    # Animated star field
│   ├── vite.config.ts
│   └── package.json
├── src/                         # Terminal UI module (Python star renderer)
└── references_coding_ai/        # Original C# reference program
```

---

## Setup

### 1. Python environment (one time)

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

### 2. Frontend dependencies (one time)

```powershell
cd frontend
npm install
```

---

## Running locally

### Backend

```powershell
cd backend
uvicorn main:app --reload
```

Runs at `http://localhost:8000`. The SQLite database (`auction.db`) is created automatically on first run.

### Frontend

```powershell
cd frontend
npm run dev
```

Runs at `http://localhost:5173`.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/stars` | Star field data |
| `POST` | `/session` | Create a new auction session |
| `POST` | `/session/{id}/step` | Send user input, advance state |

Interactive docs: `http://localhost:8000/docs`

### Session flow

```
POST /session
  → returns intro messages + first input prompt (name)

POST /session/{id}/step  { "value": "Phoenix" }
  → returns next messages + next input prompt (age)

... and so on through the full auction sequence
```

---

## Auction state machine

The backend enforces the exact control flow from the original C# program:

```
NAME_INPUT → AGE_INPUT → ALIVE_INPUT
  → STORY_PAUSE_1 → STORY_PAUSE_2
  → BID_CHOICE
      "1" → BIDDING (loop)
               valid bid → WIN_PAUSE → VERIFY_AGE → WON → ENDED
               bid = 0   → LOSS_PAUSE → ENDED
      "0" → LOSS_PAUSE → ENDED
```

---

## Environment variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `auction.db` | SQLite file path |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS origins |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

Create a `frontend/.env.local` for local overrides.

---

## Upgrading to Turso

Open `backend/app/session_store.py` and replace the two lines under the `_conn()` function:

```python
# Before (sqlite3)
import sqlite3
conn = sqlite3.connect(_DB_PATH)

# After (Turso / libsql)
import libsql_experimental as libsql
conn = libsql.connect(
    database=os.getenv("TURSO_DATABASE_URL"),
    auth_token=os.getenv("TURSO_AUTH_TOKEN"),
)
```

All SQL and row access is identical — libsql is API-compatible with sqlite3.

---

## Deployment

### Backend → Fly.io

```bash
cd backend
fly launch
fly secrets set ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

Set `VITE_API_URL=https://your-backend.fly.dev` in the Vercel dashboard under Project → Settings → Environment Variables.
