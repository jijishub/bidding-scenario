from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

from .models import InputConfig

STARTING_BID = 50_000.0
STARTING_MONEY = 100_000.0
NO_BID_INCENTIVE = 20_000.0
WIN_INCENTIVE = 30_000.0  # credited on top of bid deduction (20k item + 10k table)


@dataclass
class SessionData:
    id: str
    state: str = "NAME_INPUT"
    name: str = ""
    age: float = 0.0
    half_age: float = 0.0
    alive: bool = True
    balance: float = STARTING_MONEY
    item_price: float = STARTING_BID
    my_bid: float = 0.0
    new_balance: float = 0.0


def _fmt(n: float) -> str:
    return f"{int(n):,}" if n == int(n) else f"{n:,.2f}"


def start_session(session: SessionData) -> Tuple[List[str], InputConfig]:
    """Called once when a session is created. Returns intro messages + first input."""
    session.state = "NAME_INPUT"
    return (
        [
            "Your seat number is 666.  His seat number is 777.",
            "1443 is your table number.",
            "It is cool that your table number is 1443, because 666 and 777 is 1443.",
        ],
        InputConfig(type="text", label="Type your name:", placeholder="Your name..."),
    )


def process_step(session: SessionData, value: str) -> Tuple[List[str], InputConfig]:
    """Process one user input, mutate session in-place, return (messages, next_input)."""
    v = value.strip()

    # ── Name ──────────────────────────────────────────────────────────────────
    if session.state == "NAME_INPUT":
        if not v:
            return (
                ["Please enter a name."],
                InputConfig(type="text", label="Type your name:", placeholder="Your name..."),
            )
        session.name = v
        session.state = "AGE_INPUT"
        return [], InputConfig(type="number", label="Type your age:", placeholder="e.g. 20")

    # ── Age ───────────────────────────────────────────────────────────────────
    if session.state == "AGE_INPUT":
        try:
            session.age = float(v)
            session.half_age = session.age / 2
        except ValueError:
            return (
                ["Please enter a valid number for your age."],
                InputConfig(type="number", label="Type your age:", placeholder="e.g. 20"),
            )
        session.state = "ALIVE_INPUT"
        return [], InputConfig(
            type="choice",
            label="Are you alive?",
            options=["true — Yes, I am alive", "false — No, I am dead"],
        )

    # ── Alive ─────────────────────────────────────────────────────────────────
    if session.state == "ALIVE_INPUT":
        session.alive = v.startswith("true")
        status = "Alive" if session.alive else "Dead"
        session.state = "STORY_PAUSE_1"
        return (
            [
                f"Status: {status}",
                (
                    f"Your age is currently {_fmt(session.age)}. But in this household "
                    f"you will use half your age, you are now {_fmt(session.half_age)}."
                ),
            ],
            InputConfig(type="continue", label="Press any key to proceed..."),
        )

    # ── Story beat 1 — beep × 3, hologram appears ─────────────────────────────
    if session.state == "STORY_PAUSE_1":
        session.state = "STORY_PAUSE_2"
        return (
            [
                "That is the sound of the auction motioning to start.",
                "A tablet-sized hologram appeared in front of you.",
                (
                    f"\tThe screen says, 'Are you alive? {str(session.alive).lower()}' "
                    f"\n\tA symbol then appeared on the screen: @"
                ),
            ],
            InputConfig(type="continue", label="Press any key to proceed..."),
        )

    # ── Story beat 2 — name reveal, item announcement ─────────────────────────
    if session.state == "STORY_PAUSE_2":
        session.state = "BID_CHOICE"
        return (
            [
                f"\t'Your name is {session.name}. In this household, you will be named Phoenix.'",
                (
                    f"\t'Hello @Phoenix,\n\t\tAccording to your account, your beginning money is "
                    f"Php {_fmt(session.balance)}. The first showcase collection is to be auctioned "
                    f"for a starting bid of {_fmt(session.item_price)} pesos for all items.'"
                ),
                (
                    "A female voice sounded all over the massive hall. \"Ladies and gentlemen, welcome!\" "
                    "She made a short introduction of tonight's auction. \"...Without further ado, "
                    "the first item for tonight's first collection is a limited-edition golden tumbler "
                    "from the Overworld, dating back to 2023. This tumbler holds immense historical value "
                    "and is sought after by collectors worldwide. Bidding is now open!\""
                ),
                (
                    "You look at the magnificent tumbler from your own hologram screen. A text is embedded "
                    "on the side of the tumbler. 'Aquaflask', it says. The item ID is 0001."
                ),
            ],
            InputConfig(
                type="choice",
                label="Do you want to bid for the item?",
                options=["1 — Yes, I want to bid", "0 — No, skip this item"],
            ),
        )

    # ── Bid choice ────────────────────────────────────────────────────────────
    if session.state == "BID_CHOICE":
        if v.startswith("1"):
            session.state = "BIDDING"
            return [], InputConfig(
                type="number",
                label="Enter your Bid, or type 0 to stop bidding:",
                placeholder=f"Must exceed {_fmt(session.item_price)}",
            )
        if v.startswith("0"):
            return _loss_outcome(session)
        return (
            ["Please select 1 (Yes) or 0 (No)."],
            InputConfig(
                type="choice",
                label="Do you want to bid for the item?",
                options=["1 — Yes, I want to bid", "0 — No, skip this item"],
            ),
        )

    # ── Bidding loop ──────────────────────────────────────────────────────────
    if session.state == "BIDDING":
        try:
            bid = float(v)
        except ValueError:
            return (
                ["Invalid input. Please enter a number."],
                InputConfig(
                    type="number",
                    label="Enter your Bid, or type 0 to stop bidding:",
                    placeholder=f"Must exceed {_fmt(session.item_price)}",
                ),
            )

        if bid == 0:
            return _loss_outcome(session)

        if bid <= session.item_price:
            return (
                [f"\t'Your bid must be higher than Php {_fmt(session.item_price)} (Current highest bid).'"],
                InputConfig(
                    type="number",
                    label="Enter your Bid, or type 0 to stop bidding:",
                    placeholder=f"Must exceed {_fmt(session.item_price)}",
                ),
            )

        if bid > session.balance:
            return (
                [f"\t'You cannot bid more than what you have. Your balance is Php {_fmt(session.balance)}.'"],
                InputConfig(
                    type="number",
                    label="Enter your Bid, or type 0 to stop bidding:",
                    placeholder=f"Must exceed {_fmt(session.item_price)}",
                ),
            )

        # Valid bid
        session.my_bid = bid
        session.item_price = bid
        session.state = "WIN_PAUSE"
        return (
            [
                f"\t'You bid Php {_fmt(bid)}.'",
                (
                    f"The host announced, \"We have multiple bidders sending their bids in the database now. "
                    f"The highest bidder is from table 1443, entering the bid with an amount of "
                    f"Php {_fmt(bid)}. Who wants to up the price?\""
                ),
                (
                    "Other bidders started to enter their prices but you remained the highest bidder. "
                    "\"Going once, going twice... Sold to the highest bidder from table 1443!\""
                ),
                "You are the highest bidder. The System announced it to everyone.",
            ],
            InputConfig(type="continue", label="Press any key to proceed..."),
        )

    # ── Win pause — key press before final win messages ───────────────────────
    if session.state == "WIN_PAUSE":
        session.new_balance = session.balance - session.my_bid + WIN_INCENTIVE
        session.state = "VERIFY_AGE"
        return (
            [
                (
                    f"\t'System: Congratulations! Item 0001 was sold to User @Phoenix, the first highest "
                    f"bidder, for Php {_fmt(session.item_price)}. \n\tThey will receive an incentive of "
                    f"Php 20,000 and all bidders from @Phoenix's table will receive Php 10,000 each.'"
                ),
                "Consequently, you receive another message from your screen.",
                (
                    f"\t'Hello @Phoenix,\n\t\tYou received Php 30,000 incentive in your account. "
                    f"Your balance is now Php {_fmt(session.new_balance)}. Item 0001 is beginning its "
                    f"transfer to your account. For verification, please type your age below.'"
                ),
            ],
            InputConfig(
                type="number",
                label="UserName: @Phoenix  ·  Verification — Enter your age:",
                placeholder="Your age...",
            ),
        )

    # ── Age verification ──────────────────────────────────────────────────────
    if session.state == "VERIFY_AGE":
        try:
            entered = float(v)
        except ValueError:
            return (
                ["Invalid input. Please enter a number."],
                InputConfig(type="number", label="Verification — Enter your age:", placeholder="Your age..."),
            )
        if entered == session.half_age:
            session.state = "WON"
            return (
                [
                    "\n\t'Congratulations! You have successfully claimed Item 0001 "
                    "and it is now moved into your account inventory.'",
                    "The first bidding ended.",
                ],
                InputConfig(type="done", label="Auction complete."),
            )
        return (
            ["You are not ineligible to claim the item."],
            InputConfig(type="number", label="Verification — Enter your age:", placeholder="Your age..."),
        )

    # ── Loss pause — key press before final loss messages ────────────────────
    if session.state == "LOSS_PAUSE":
        session.state = "ENDED"
        return (
            [
                (
                    f"\t'Hello @Phoenix,\n\t\tYou received Php 20,000 in your account. "
                    f"Your money is now Php {_fmt(session.balance)}.'"
                ),
                "The first bidding ended.",
            ],
            InputConfig(type="done", label="Auction ended."),
        )

    # ── Terminal states ───────────────────────────────────────────────────────
    if session.state in ("WON", "ENDED"):
        return ["The auction has concluded."], InputConfig(type="done", label="Game over.")

    return ["Unknown state. Please start a new session."], InputConfig(type="done")


def _loss_outcome(session: SessionData) -> Tuple[List[str], InputConfig]:
    """Shared path for 'chose not to bid' and 'typed 0 mid-bid'."""
    session.balance += NO_BID_INCENTIVE
    session.state = "LOSS_PAUSE"
    return (
        [
            "You decide not to bid.",
            (
                "The host announced, \"We have multiple bidders sending their bids in the database now. "
                "The highest bidder is from table 1443, entering the bid with an amount of Php 70,000.\""
            ),
            (
                f"\t\"Item 0001 is now worth Php {_fmt(session.item_price)}. Who wants to up the bid?\" "
                "\n\tThe auction went on until Item 0001 was sold to user @SwiftFox of Table 3388 "
                "for Php 120,000. The System announced it for everyone."
            ),
            (
                "\t'System: Congratulations! Item 0001 was sold to User @SwiftFox for Php 120,000, "
                "the first highest bidder. \n\tThey will receive an incentive of Php 50,000 and all "
                "bidders from @SwiftFox's table will receive Php 20,000 incentives each.'"
            ),
            "Consequently you receive another message from your screen.",
        ],
        InputConfig(type="continue", label="Press any key to proceed..."),
    )
