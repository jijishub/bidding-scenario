from __future__ import annotations
from pydantic import BaseModel
from typing import List, Literal, Optional, Union

InputType = Literal["text", "number", "boolean", "choice", "continue", "done"]


class InputConfig(BaseModel):
    type: InputType
    label: str = ""
    placeholder: str = ""
    options: Optional[List[str]] = None


class MessagePart(BaseModel):
    text: str
    color: Optional[str] = None
    italic: Optional[bool] = None


class Message(BaseModel):
    """Message can be plain string, object with text and optional color,
    or made of multiple differently-colored parts on the same line."""
    text: str = ""
    color: Optional[str] = None
    italic: Optional[bool] = None
    parts: Optional[List[MessagePart]] = None


class StepRequest(BaseModel):
    value: str = ""


class StepResponse(BaseModel):
    session_id: str
    messages: List[Union[str, Message]]
    input: InputConfig
    state: str
    actions: List[str] = []
    done: bool = False
