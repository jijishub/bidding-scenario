"""Reusable utility, formatting, and UI input factory functions.

Single source of truth for inputs, formatting, and calculations.
"""

from __future__ import annotations

from typing import List

from .models import InputConfig

INVENTORY = True


def _fmt(n: float) -> str:
    """Formats a float with commas, e.g. 50,000 or 50,000.50."""
    return f"{int(n):,}" if n == int(n) else f"{n:,.2f}"


def _calc_incentive(winning_bid: float) -> float:
    """Tiered incentive: the higher the winning bid, the greater the reward."""
    if winning_bid <= 65_000:
        return 10_000.0
    elif winning_bid <= 80_000:
        return 20_000.0
    elif winning_bid <= 90_000:
        return 30_000.0
    else:
        return 40_000.0


def _get_break_options() -> List[str]:
    """Returns available break options depending on whether inventory is enabled."""
    return (
        ["1 — Check balance", "2 — Check inventory", "0 — Continue"]
        if INVENTORY
        else ["1 — Check balance", "0 — Continue"]
    )


# ── Input Config Factories (Single Source of Truth) ───────────────────────────

def get_bid_choice_input() -> InputConfig:
    return InputConfig(
        type="choice",
        label="Do you want to bid for the item?",
        options=["1 — Yes, I want to bid", "0 — No, skip this item"],
    )


def get_bidding_input(item_price: float) -> InputConfig:
    return InputConfig(
        type="number",
        label="Enter your Bid, or type 0 to stop bidding:",
        placeholder=f"Must exceed {_fmt(item_price)}",
    )


def get_verify_age_input(name: str = "Phoenix") -> InputConfig:
    return InputConfig(
        type="number",
        label=f"UserName: @{name}  ·  Verification — Enter your age:",
        placeholder="Your age...",
    )


def get_break_input() -> InputConfig:
    return InputConfig(
        type="choice",
        label="What would you like to do during the break?",
        options=_get_break_options(),
    )

def continue_choice_input(label: str = "Press any key to proceed...") -> InputConfig:
    return InputConfig(
        type="continue",
        label=label,
    )