"""SQLite-backed session store.

To upgrade to Turso, replace the two lines under "CONNECTION" with:

    import libsql_experimental as libsql
    conn = libsql.connect(
        database=os.getenv("TURSO_DATABASE_URL", ":memory:"),
        auth_token=os.getenv("TURSO_AUTH_TOKEN", ""),
    )

Everything else (SQL, row access) is identical — libsql is API-compatible with sqlite3.
"""

from __future__ import annotations

import os
import sqlite3
from typing import Optional

from .state_machine import SessionData

_DB_PATH = os.getenv("DB_PATH", "auction.db")


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(_DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id                   TEXT PRIMARY KEY,
                state                TEXT    NOT NULL DEFAULT 'NAME_INPUT',
                name                 TEXT    NOT NULL DEFAULT '',
                age                  REAL    NOT NULL DEFAULT 0,
                half_age             REAL    NOT NULL DEFAULT 0,
                alive                INTEGER NOT NULL DEFAULT 1,
                balance              REAL    NOT NULL DEFAULT 100000,
                item_price           REAL    NOT NULL DEFAULT 50000,
                my_bid               REAL    NOT NULL DEFAULT 0,
                new_balance          REAL    NOT NULL DEFAULT 0,
                counter_count        INTEGER NOT NULL DEFAULT 0,
                last_counterer       TEXT    NOT NULL DEFAULT '@Viper',
                last_counterer_table TEXT    NOT NULL DEFAULT '3388',
                inventory            TEXT    NOT NULL DEFAULT ''
            )
        """)
        c.commit()

        # Migrate older databases created before these columns existed.
        existing_cols = {row[1] for row in c.execute("PRAGMA table_info(sessions)")}
        for col, decl in {
            "counter_count": "INTEGER NOT NULL DEFAULT 0",
            "last_counterer": "TEXT NOT NULL DEFAULT '@Viper'",
            "last_counterer_table": "TEXT NOT NULL DEFAULT '3388'",
            "inventory": "TEXT NOT NULL DEFAULT ''",
        }.items():
            if col not in existing_cols:
                c.execute(f"ALTER TABLE sessions ADD COLUMN {col} {decl}")
        c.commit()


def save_session(s: SessionData) -> None:
    with _conn() as c:
        c.execute(
            """
            INSERT OR REPLACE INTO sessions
                (id, state, name, age, half_age, alive, balance, item_price, my_bid, new_balance,
                 counter_count, last_counterer, last_counterer_table, inventory)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                s.id, s.state, s.name, s.age, s.half_age,
                1 if s.alive else 0,
                s.balance, s.item_price, s.my_bid, s.new_balance,
                s.counter_count, s.last_counterer, s.last_counterer_table, s.inventory
            ),
        )
        c.commit()


def load_session(session_id: str) -> Optional[SessionData]:
    with _conn() as c:
        row = c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if row is None:
        return None
    return SessionData(
        id=row["id"],
        state=row["state"],
        name=row["name"],
        age=row["age"],
        half_age=row["half_age"],
        alive=bool(row["alive"]),
        balance=row["balance"],
        item_price=row["item_price"],
        my_bid=row["my_bid"],
        new_balance=row["new_balance"],
        counter_count=row["counter_count"],
        last_counterer=row["last_counterer"],
        last_counterer_table=row["last_counterer_table"],
        inventory=row["inventory"] if "inventory" in row.keys() else "",
    )
