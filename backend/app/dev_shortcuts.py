"""Development & Testing Fast-Forward Shortcuts.

Keeps state_machine.py pure and uncluttered from mock testing logic.
"""

from __future__ import annotations

from typing import List, Tuple, Union

from .models import InputConfig, Message
from .state_machine import (
    SessionData,
    _calc_incentive,
    _fmt,
    get_bid_choice_input,
    get_bidding_input,
    get_break_input,
    get_verify_age_input,
)

# ── Dev Test Credentials ──────────────────────────────────────────────────────
DEV_CREDENTIALS = {
    "name": "Phoenix",
    "age": 22.0,
    "half_age": 11.0,
    "alive": True,
}


def apply_skip_point(
    session: SessionData, point: str
) -> Tuple[List[Union[str, Message]], InputConfig]:
    """Hydrates session with test credentials and fast-forwards directly to a state."""
    (session.name, session.age, session.half_age, session.alive) = DEV_CREDENTIALS.values()

    if point == "BID_CHOICE":
        session.state = "BID_CHOICE"
        return [f"[DEV] Jumped to BID_CHOICE. Welcome @{session.name}."], get_bid_choice_input()

    if point == "BIDDING":
        session.state = "BIDDING"
        return [f"[DEV] Jumped to BIDDING (Starting bid: Php {_fmt(session.item_price)})."], get_bidding_input(session)

    if point == "VERIFY_AGE":
        session.my_bid = 95_000.0
        session.item_price = 95_000.0
        session.new_balance = session.balance - session.my_bid + _calc_incentive(session.my_bid)
        session.state = "VERIFY_AGE"
        return [f"[DEV] Jumped to VERIFY_AGE (Winning bid: Php 95,000)."], get_verify_age_input(session)

    if point == "BID_BREAK_LOSS":
        session.balance = 120_000.0
        session.state = "BID_BREAK"
        return [f"[DEV] Jumped to Break Room (Consolation: Php {_fmt(session.balance)})."], get_break_input()

    # Default fallback: "BID_BREAK_WIN"
    session.balance = 45_000.0
    session.state = "BID_BREAK"
    return [f"[DEV] Jumped to Break Room (Won Item 001: Php {_fmt(session.balance)})."], get_break_input()
