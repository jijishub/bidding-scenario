from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Tuple, Union

from .models import InputConfig, Message, MessagePart

STARTING_BID = 50_000.0
STARTING_MONEY = 100_000.0
NO_BID_INCENTIVE = 20_000.0

COMPETITOR_NAME = "@SwiftFox"    # Table 1443 — the mystery bidder who eventually wins if you walk away
COMPETITOR_MAX = 90_000.0        # Viper will not bid above this amount
COMPETITOR_INCREMENT = 5_000.0   # Viper or any competitor always counters by this much above your bid

COMPETITOR_NAME2 = "@Viper"  # Table 3388

NAME_PATTERN = re.compile(r"^[A-Za-z\s-]+$")

INVENTORY=False


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
    counter_count: int = 0
    last_counterer: str = COMPETITOR_NAME2
    last_counterer_table: str = "3388"


def _fmt(n: float) -> str:
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


def process_step(session: SessionData, value: str) -> Tuple[List[Union[str, Message]], InputConfig, List[str]]:
    """Process one user input, mutate session in-place, return (messages, next_input, actions)."""
    v = value.strip()

    # ── Name ──────────────────────────────────────────────────────────────────
    if session.state == "NAME_INPUT":
        if not v:
            return (
                ["Please enter a name."],
                InputConfig(type="text", label="Type your name:", placeholder="Your name..."),
                [],
            )
        if not NAME_PATTERN.match(v):
            return (
                ["Names can only contain letters, spaces, and hyphens. Please try again."],
                InputConfig(type="text", label="Type your name:", placeholder="Your name..."),
                [],
            )
        session.name = v.title()
        session.state = "AGE_INPUT"
        return [], InputConfig(type="number", label="Type your age:", placeholder="Type your age..."), []

    # ── Age ───────────────────────────────────────────────────────────────────
    if session.state == "AGE_INPUT":
        try:
            session.age = float(v)
            session.half_age = session.age / 2
        except ValueError:
            return (
                ["Please enter a valid number for your age."],
                InputConfig(type="number", label="Type your age:", placeholder="Type your age..."),
                [],
            )
        session.state = "ALIVE_INPUT"
        return [], InputConfig(
            type="choice",
            label="Are you alive?",
            options=["true — Yes, I am alive", "false — No, I am dead"],
        ), []

    # ── Alive ─────────────────────────────────────────────────────────────────
    if session.state == "ALIVE_INPUT":
        normalized = v.lower()
        session.alive = normalized.startswith("true") or normalized.startswith("1") or normalized.startswith("yes") or normalized.startswith("alive")
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
            [],
        )

    # ── Story beat 1 — beep × 3, hologram appears ─────────────────────────────
    if session.state == "STORY_PAUSE_1":
        session.state = "STORY_PAUSE_2"
        return (
            [
                "That is the sound of the auction motioning to start.",
                "A tablet-sized hologram appeared in front of you.",
                Message(
                    text=f"\tThe screen says,'Are you alive? {str(session.alive).lower()}'",
                    parts=[
                        MessagePart(text="\tThe screen says,", color="#67e8f9"),
                        MessagePart(text=f"'Are you alive? {str(session.alive).lower()}'", color="white"),
                    ],
                ),
                Message(
                    text="\n\tA symbol then appeared on the screen: @",
                    parts=[
                        MessagePart(text="\n\tA symbol then appeared on the screen: ", color="#67e8f9"),
                        MessagePart(text="@", color="white"),
                    ],
                ),
            ],
            InputConfig(type="continue", label="Press any key to proceed..."),
            ["play_beep_3x"],
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
            [],
        )

    # ── Story beat 3 - First Bid break ─────────────────────────────────────────────
    if session.state == "WON" or session.state == "ENDED":
        session.state = "BID_BREAK"
        
        break_options = (
            ["1 — Check balance", "2 — Check inventory", "0 — Continue"] 
            if INVENTORY 
            else ["1 — Check balance", "0 — Continue"]
        )
        
        return (
                    [
                        Message(text="The host announces that the first bidding is now over.", color="#white"),
                        Message(text="\t\"We have fifteen minute break before the next bidding starts. During this time, you can check your balance and prepare for the next item.\"", color="#67e8f9"),
                        Message(text="\t\"For those who have acquired inventories, please check your hologram screen for the items you have won.\", informed the host.", color="#67e8f9"),
                    ],
                    InputConfig(
                        type="choice",
                        label="What would you like to do during the break?",
                        options=break_options,
                    ),
                    [],
                )
    
    #Inventory checker
    if session.state == "BID_BREAK":
        if v.startswith("1"):
            session.state = "CHECK_BALANCE"
            return [], InputConfig(
                type="continue",
                label=f"Your current balance is Php {_fmt(session.new_balance)}. Press any key to continue...",
            ), []
        if v.startswith("2"):
            session.state = "CHECK_INVENTORY"
            return [], InputConfig(
                type="continue",
                label="Checking your inventory. Press any key to continue...",
            ), []
        if v.startswith("0"):
            session.state = "STORY_PAUSE_4"
            return [], InputConfig(
                type="continue",
                label="You chose to continue without checking your balance. Press any key to proceed...",
            ), []
        return (
            ["Please select 1 (Check balance), 2 (Check inventory), or 0 (Continue)."],
            InputConfig(
                type="choice",
                label="What would you like to do during the break?",
                options=["1 — Check balance", "2 — Check inventory", "0 — Continue"],
            ),
            [],
        )

    # ── Bid choice ────────────────────────────────────────────────────────────
    if session.state == "BID_CHOICE":
        if v.startswith("1"):
            session.state = "BIDDING"
            return [], InputConfig(
                type="number",
                label="Enter your Bid, or type 0 to stop bidding:",
                placeholder=f"Must exceed {_fmt(session.item_price)}",
            ), []
        if v.startswith("0"):
            return _loss_outcome(session)
        return (
            ["Please select 1 (Yes) or 0 (No)."],
            InputConfig(
                type="choice",
                label="Do you want to bid for the item?",
                options=["1 — Yes, I want to bid", "0 — No, skip this item"],
            ),
            [],
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
                [],
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
                [],
            )

        if bid > session.balance:
            return (
                [f"\t'You cannot bid more than what you have. Your balance is Php {_fmt(session.balance)}.'"],
                InputConfig(
                    type="number",
                    label="Enter your Bid, or type 0 to stop bidding:",
                    placeholder=f"Must exceed {_fmt(session.item_price)}",
                ),
                [],
            )

        # Valid bid — check if the competitor can counter
        competitor_bid = bid + COMPETITOR_INCREMENT

        if competitor_bid <= COMPETITOR_MAX:
            # @Viper counters your first bid only; @SwiftFox handles every counter after that.
            session.item_price = competitor_bid
            if session.counter_count == 0:
                counterer_name, counterer_table = COMPETITOR_NAME2, "3388"
            else:
                counterer_name, counterer_table = COMPETITOR_NAME, "1443"
            session.counter_count += 1
            session.last_counterer, session.last_counterer_table = counterer_name, counterer_table
            return (
                [
                    f"\t'You bid Php {_fmt(bid)}.'",
                    (
                        f"The host announced, \"We have multiple bidders sending their bids in the database now. "
                        f"The highest bidder is from table 1443, entering the bid with an amount of "
                        f"Php {_fmt(bid)}. Who wants to up the price?\""
                    ),
                    (
                        f"Bidder {counterer_name} from Table {counterer_table} counters with Php {_fmt(competitor_bid)}. "
                        f"You are no longer the highest bidder."
                    ),
                ],
                InputConfig(
                    type="number",
                    label="Enter your Bid, or type 0 to stop bidding:",
                    placeholder=f"Must exceed {_fmt(session.item_price)}",
                ),
                [],
            )

        # Competitor cannot match — player wins
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
            [],
        )

    # ── Win pause — key press before final win messages ───────────────────────
    if session.state == "WIN_PAUSE":
        incentive = _calc_incentive(session.my_bid)
        session.new_balance = session.balance - session.my_bid + incentive
        session.state = "VERIFY_AGE"
        return (
            [
                (
                    f"\t'System: Congratulations! Item 001 was sold to User @Phoenix, the first highest "
                    f"bidder, for Php {_fmt(session.item_price)}. \n\tThey will receive an incentive of "
                    f"Php {_fmt(incentive)}.'"
                ),
                "Consequently, you receive another message from your screen.",
                (
                    f"\t'Hello @Phoenix,\n\t\tYou received Php {_fmt(incentive)} incentive in your account. "
                    f"Your balance is now Php {_fmt(session.new_balance)}. Item 001 is beginning its "
                    f"transfer to your account. For verification, please type your age below.'"
                ),
            ],
            InputConfig(
                type="number",
                label="UserName: @Phoenix  ·  Verification — Enter your age:",
                placeholder="Your age...",
            ),
            [],
        )

    # ── Age verification ──────────────────────────────────────────────────────
    if session.state == "VERIFY_AGE":
        try:
            entered = float(v)
        except ValueError:
            return (
                ["Invalid input. Please enter a number."],
                InputConfig(type="number", label="Verification — Enter your age:", placeholder="Your age..."),
                [],
            )
        if entered == session.half_age:
            session.state = "BID_BREAK"
            return (
                [
                    "\n\t'Congratulations! You have successfully claimed Item 001 "
                    "and it is now moved into your account inventory.'",
                    "The first bidding ended.",
                    Message(text="The host announces that the first bidding is now over.", color="#white"),
                    Message(
                        text="\t\"We have fifteen minute break before the next bidding starts. "
                        "During this time, you can check your balance and prepare for the next item.\"",
                        color="#67e8f9",
                    ),
                    Message(
                        text="\t\"For those who have acquired inventories, please check your hologram "
                        "screen for the items you have won.\", informed the host.",
                        color="#67e8f9",
                    ),
                ],
                InputConfig(
                    type="choice",
                    label="What would you like to do during the break?",
                    options=["1 — Check balance", "2 — Check inventory", "0 — Continue"],
                ),
                ["play_beep_3x"],
            )
        return (
            ["You are not ineligible to claim the item."],
            InputConfig(type="number", label="Verification — Enter your age:", placeholder="Your age..."),
            [],
        )

    # ── Loss pause — key press before final loss messages ────────────────────
    if session.state == "LOSS_PAUSE":
        session.state = "BID_BREAK"
        return (
            [
                (
                    f"\t'Hello @Phoenix,\n\t\tYou received Php 20,000 in your account. "
                    f"Your money is now Php {_fmt(session.balance)}.'"
                ),
                "The first bidding ended.",
                Message(text="The host announces that the first bidding is now over.", color="#ffffff"),
                Message(
                    text="\t\"We have fifteen minute break before the next bidding starts. "
                    "During this time, you can check your balance and prepare for the next item.\"",
                    color="#67e8f9",
                ),
                Message(
                    text="\t\"For those who have acquired inventories, please check your hologram "
                    "screen for the items you have won.\", informed the host.",
                    color="#67e8f9",
                ),
            ],
            InputConfig(
                type="choice",
                label="What would you like to do during the break?",
                options=["1 — Check balance", "2 — Check inventory", "0 — Continue"],
            ),
            [],
        )

    # ── Terminal states ───────────────────────────────────────────────────────
    if session.state in ("WON", "ENDED"):
        return ["The auction has concluded."], InputConfig(type="done", label="Game over."), []

    return ["Unknown state. Please start a new session."], InputConfig(type="done"), []


def _loss_outcome(session: SessionData) -> Tuple[List[Union[str, Message]], InputConfig, List[str]]:
    """Shared path for 'chose not to bid' and 'typed 0 mid-bid'."""
    session.balance += NO_BID_INCENTIVE
    session.state = "LOSS_PAUSE"
    return (
        [
            "You decide not to bid.",
            (
                "The host announced, \"We have multiple bidders sending their bids in the database now. "
                f"The highest bidder is {session.last_counterer} from table {session.last_counterer_table}, "
                f"entering the bid with an amount of Php {_fmt(session.item_price)}.\""
            ),
            (
                f"\t\"Item 001 is now worth Php {_fmt(session.item_price)}. Who wants to up the bid?\" "
                f"\n\tThe auction went on until Item 001 was sold to user {COMPETITOR_NAME} of Table 1443 "
                "for Php 120,000. The System announced it for everyone."
            ),
            (
                f"\t'System: Congratulations! Item 001 was sold to User {COMPETITOR_NAME} for Php 120,000, "
                "the first highest bidder. \n\tThey will receive an incentive of Php 50,000 and all "
                f"bidders from {COMPETITOR_NAME}'s table will receive Php 20,000 incentives each.'"
            ),
            "Consequently you receive another message from your screen.",
        ],
        InputConfig(type="continue", label="Press any key to proceed..."),
        [],
    )
