# BiddingScenario

> 🚧 **Work in progress.** Story beat 1 is playable end-to-end; later chapters, inventory, and a few other threads listed in `plot_context/plot.txt` are still unbuilt. Expect breaking changes while this is actively developed.

A sci-fi auction simulation ported from a personal C# console exercise into a decoupled web app. The backend runs a strict state-machine replica of the original bidding logic; the frontend renders it as a glassmorphism terminal with a character-by-character typing effect.

**Stack:** FastAPI · SQLite (Turso-ready) · React 19 · TypeScript · Tailwind CSS v4 · Vite 8

**Deployment targets:** Fly.io (backend - planning to change) · Vercel (frontend)

---

## Provenance & License

The web app's logic is a from-scratch reimplementation of an earlier C# console exercise by the same author, kept in [`references_coding_ai/`](references_coding_ai/) for historical reference — it isn't a third-party source.

This repository has no `LICENSE` file, so standard copyright applies by default: being publicly visible does not grant permission to copy, modify, or redistribute the code. Reach out to the author if you'd like to use it beyond reading it.

---

## Project Structure

```
BiddingScenario/
├── backend/
│   ├── main.py                  # FastAPI app — /session + /session/{id}/step
│   ├── requirements.txt
│   └── app/
│       ├── models.py            # Pydantic schemas
│       ├── state_machine.py     # Full auction logic (C# parity) + input factories
│       ├── dev_shortcuts.py     # Fast-forward jump points & testing credentials
│       ├── session_store.py     # SQLite persistence (swap 2 lines for Turso)
│       └── stars.py             # Star field generator
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Session lifecycle + typing queue
│   │   ├── Teleprompter.tsx     # Glassmorphism panel + star background + Dev shortcuts
│   │   ├── api.ts               # createSession / sendStep
│   │   ├── types.ts             # Shared TypeScript interfaces
│   │   └── components/
│   │       ├── MessageLog.tsx   # Typing animation
│   │       ├── InputArea.tsx    # Context-aware input (text/choice/continue/done)
│   │       └── StarField.tsx    # Animated star field
│   ├── vite.config.ts
│   └── package.json
├── src/                         # Terminal UI module (Python star renderer)
├── tests/                       # Backend smoke tests (pytest)
├── plot_context/                # Living plot & testing reference
│   ├── plot.txt                 # Plot & option tracker, kept in sync with state_machine.py
│   └── testing.txt              # Standardized test credentials & skipping points
└── references_coding_ai/        # Original C# exercise this project grew out of
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
               valid bid → WIN_PAUSE → VERIFY_AGE → BID_BREAK (Check balance / Inventory / Continue)
                            CHECK_BALANCE ───↩
               bid = 0   → LOSS_PAUSE → BID_BREAK
      "0" → LOSS_PAUSE → BID_BREAK
```

---

## Developer & Testing Shortcuts (Dev Mode)

To streamline testing without manually re-typing intake credentials every run:
- **Title Bar `⚙ DEV` Button**: Open the app at `http://localhost:5173`, click **`⚙ DEV`** in the top right of the terminal header, and jump instantly to any phase:
  - ⚡ **Bid Choice** (Skip intake prologue)
  - ⚡ **Bidding Duel** (Jump straight into the active auction)
  - ⚡ **Claim Item (Code 11)** (Jump to verification prompt)
  - ⚡ **Break Room (Win)** (Balance = Php 45,000)
  - ⚡ **Break Room (Loss)** (Balance = Php 120,000)
  - 🔄 **Normal Start** (Reset to prologue)
- **Standardized Test Credentials**: Name: `Phoenix`, Age: `22.0`, Verification code (`half_age`): `11.0`, Alive: `True`.
- **Reference**: See [`plot_context/testing.txt`](plot_context/testing.txt).

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

### Backend → Fly.io - planning to change

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
