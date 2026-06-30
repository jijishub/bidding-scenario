from __future__ import annotations
from pydantic import BaseModel
from typing import List, Literal, Optional

InputType = Literal["text", "number", "boolean", "choice", "continue", "done"]


class InputConfig(BaseModel):
    type: InputType
    label: str = ""
    placeholder: str = ""
    options: Optional[List[str]] = None


class StepRequest(BaseModel):
    value: str = ""


class StepResponse(BaseModel):
    session_id: str
    messages: List[str]
    input: InputConfig
    state: str
    done: bool = False
