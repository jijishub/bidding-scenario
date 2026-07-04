from __future__ import annotations

import os
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import StepRequest, StepResponse
from app.state_machine import SessionData, start_session, process_step
from app.session_store import init_db, save_session, load_session
from app.stars import generate_star_field


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="BiddingScenario API", version="2.0", lifespan=lifespan)

_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:4173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok"}


@app.get("/stars")
def get_stars():
    return {"stars": generate_star_field(80, 24, 0.08)}


@app.post("/session", response_model=StepResponse)
def create_session():
    session_id = uuid.uuid4().hex[:10]
    session = SessionData(id=session_id)
    msgs, input_cfg = start_session(session)
    save_session(session)
    return StepResponse(
        session_id=session_id,
        messages=msgs,
        input=input_cfg,
        state=session.state,
        done=False,
    )


@app.post("/session/{session_id}/step", response_model=StepResponse)
def step_session(session_id: str, body: StepRequest):
    session = load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs, input_cfg, actions = process_step(session, body.value)
    save_session(session)

    return StepResponse(
        session_id=session_id,
        messages=msgs,
        input=input_cfg,
        state=session.state,
        actions=actions,
        done=session.state in ("WON", "ENDED"),
    )
