# BiddingScenario

A sci-fi themed auction simulation with a FastAPI backend and a React frontend. The app displays an opening sequence and lets users submit bids through a glassmorphism-style teleprompter UI.

## Project Structure

```
BiddingScenario/
├── backend/          # FastAPI server
│   ├── main.py       # App entry point & API routes
│   ├── requirements.txt
│   └── app/
│       ├── logic.py  # AuctionController (bid validation, state)
│       └── stars.py  # Star field data generator
├── frontend/         # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx           # Main view, fetches auction sequence
│       └── Teleprompter.tsx  # Glassmorphism dialog component
└── src/              # Terminal UI module (star renderer)
```

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Python, FastAPI, Uvicorn |
| Frontend | React 19, TypeScript, Vite, Axios |

## Getting Started

### 1. Backend

```bash
# From the project root
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r backend/requirements.txt

cd backend
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint            | Description                        |
|--------|---------------------|------------------------------------|
| GET    | `/`                 | Health check                       |
| GET    | `/initial-sequence` | Returns the auction opening lines  |
| GET    | `/stars`            | Returns random star field data     |
| POST   | `/bid`              | Submit a bid (`bidder`, `amount`)  |

Interactive docs available at `http://localhost:8000/docs`.

## Submitting a Bid

Send a POST request to `/bid` with JSON:

```json
{ "bidder": "Phoenix", "amount": 75000 }
```

The server responds with a message confirming the bid or explaining why it was rejected (too low, invalid input).
