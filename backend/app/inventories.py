"""Item Catalog and Inventory Formatter."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

from .models import Message


@dataclass
class Item:
    id: str
    name: str
    value: float
    description: str


# ── Catalog of All Auction Items ──────────────────────────────────────────────
CATALOG: Dict[str, Item] = {
    "0001": Item(
        id="0001",
        name="Aquaflask Golden Tumbler",
        value=50_000.0,
        description=(
            "A limited-edition golden tumbler from the Overworld, dating back to 2023. "
            "Holds immense historical value and is sought after by collectors worldwide."
        ),
    ),
}


def get_item(item_id: str) -> Optional[Item]:
    """Retrieve an item by its ID."""
    return CATALOG.get(item_id)


def render_inventory_messages(item_ids_str: str) -> List[Message]:
    """Formats the player's acquired items for the hologram screen."""
    # Split comma-separated IDs (e.g. "0001,0002")
    raw_ids = [i.strip() for i in item_ids_str.split(",") if i.strip()]

    if not raw_ids:
        return [
            Message(
                text="\t[Inventory]: You currently have no items in your inventory.",
                color="#94a3b8",
            )
        ]

    messages: List[Message] = [
        Message(text="\t=== INVENTORY ===", color="#ffffff")
    ]

    for index, item_id in enumerate(raw_ids, start=1):
        item = CATALOG.get(item_id)
        if item:
            messages.append(
                Message(
                    text=f"\t{index}. {item.name} (ID: {item.id})\n"
                         f"\t   Value: Php {int(item.value):,} | Details: {item.description}",
                    color="#ffffff",
                )
            )

    return messages