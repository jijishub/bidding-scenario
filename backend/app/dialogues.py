"""Chapter 2 Dialogue Catalog.

Single source of truth for Chapter 2 dialogue lines referenced by conversation code numbers.
"""

from __future__ import annotations

from typing import Dict, Optional, Union
from .models import Message, MessagePart


# ── Chapter 2 Dialogue Catalog (Referenced by Code Number) ────────────────────
# Dialogue entries can be a single Message or a dict mapping option numbers/keys (1, 2, 3...) to Messages.
DIALOGUES: Dict[str, Union[Message, Dict[Union[int, str], Message]]] = {
    # Break Room Conclusion & Chapter 2 Transition
    "D201": Message(
        text="The fifteen-minute break draws to a close.",
        color="#ffffff",
    ),
    "D202": Message(
        text="A chime sounded across the hall as the overhead lights dimmed once again.",
        color="#ffffff",
    ),
    "D203": Message(
        text='A female voice sounded all over the massive hall. "Ladies and gentlemen, welcome back! '
             'The second showcase collection is about to begin."',
        color="white",
    ),
    "D204": Message(
        text="\t'Hello @{name},\n\t\tYour current balance available for bidding is Php {balance}.'",
        color="#ffffff",
    ),
    "D205": {
        1: Message(
            text="You hold the AquaFlask tumbler in your hands, and you can feel the weight of it.\n",
            color="white",
        ),
        2: Message(
            text="You watch the winning bidder hold the AquaFlask tumbler in their hands, wishing you could feel the weight of it.\n",
            color="white",
        ),
    },
    "D206": Message(
        text=(
            "Everyone in the hall is bustling; the previous bidding was intense.\n"
            "A golden AquaFlask tumbler is a staple of the Late Silicon Era. This is very well preserved.\n"
            "It is no longer usable and the lead in the tumbler can poison you. Still, you feel that it was once valued by its previous owner. "
            'To your surprise, you can see a small engraving on the bottom of the tumbler: "To my dearest, may this AquaFlask keep your drinks cold and your heart warm."\n'
            "You are a Silicon Era nerd, and you have a deep knowledge of the history. An Arabic king, you thought, would have owned this. "
            "You examine the hologram translation of the script."
        ),
        color="white",
    ),
    "D207": Message(
        text=(
            "\tBefore you know it, the next bidding began. This time, it's a trifold auction. "
            "You either bid for one item and successfully get it, or another person can outbid you for 2 items, or all three of them.\n"
            "Trifold biddings are tricky. The worst thing about auctions like this is that they never say the defects of the items, if there are any. "
            "Trifold auctions are usually done because it is sold by an organization, and not because the items are related to each other."
        ),
        color="white",
    ),
    "D208": Message(
        text="*caveat emptor* - let the buyer beware.",
        color="teal",
    ),

}
"""You Ought to Pick Just One Hell"""
"""Everything in this world is hell."""

def get_dialogue(code: str, option: Optional[Union[int, str]] = None, **kwargs) -> Message:
    """Retrieves a Message by its conversation code number.

    Supports single Messages and multi-option branched dialogues (1, 2, 3...).

    Usage:
        get_dialogue("D201")
        get_dialogue("D204", name=session.name, balance=_fmt(session.balance))
        get_dialogue("D205", option=1)  # Or get_dialogue("D205", 1)
        get_dialogue("D205", option=2)
    """
    entry = DIALOGUES.get(code)
    if entry is None:
        return Message(text=f"[{code}]", color="#ef4444")

    if isinstance(entry, dict):
        # Resolve option: default to option 1 or first available option if None
        msg = entry.get(option) if option is not None else entry.get(1)
        if msg is None:
            msg = next(iter(entry.values())) if entry else Message(text=f"[{code}:{option}]", color="#ef4444")
    else:
        msg = entry

    if not kwargs:
        return msg

    try:
        formatted_text = msg.text.format(**kwargs)
    except (KeyError, ValueError):
        formatted_text = msg.text

    return Message(text=formatted_text, color=msg.color, parts=msg.parts)
