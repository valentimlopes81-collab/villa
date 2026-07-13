import sqlite3
import os
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "journal.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker      TEXT    NOT NULL,
            side        TEXT    NOT NULL,
            entry_price REAL    NOT NULL,
            tp_price    REAL    NOT NULL,
            sl_price    REAL    NOT NULL,
            timeframe   TEXT    DEFAULT '30m',
            status      TEXT    DEFAULT 'OPEN',
            entry_time  TEXT    NOT NULL,
            close_time  TEXT,
            close_price REAL,
            pnl_pct     REAL,
            rr_ratio    REAL
        )
    """)
    conn.commit()
    conn.close()


def insert_trade(ticker, side, entry, tp, sl, timeframe="30m"):
    conn = get_conn()
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    cur = conn.execute(
        """INSERT INTO trades (ticker, side, entry_price, tp_price, sl_price, timeframe, status, entry_time)
           VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)""",
        (ticker, side, entry, tp, sl, timeframe, now),
    )
    trade_id = cur.lastrowid
    conn.commit()
    conn.close()
    return trade_id


def close_trade(trade_id, close_price, status):
    conn = get_conn()
    row = conn.execute("SELECT * FROM trades WHERE id=?", (trade_id,)).fetchone()
    if not row:
        conn.close()
        return
    entry = row["entry_price"]
    side = row["side"]
    tp = row["tp_price"]
    sl = row["sl_price"]

    if side == "LONG":
        pnl_pct = (close_price - entry) / entry * 100
    else:
        pnl_pct = (entry - close_price) / entry * 100

    risk = abs(entry - sl)
    reward = abs(tp - entry)
    rr = round(reward / risk, 2) if risk > 0 else 0

    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    conn.execute(
        """UPDATE trades SET status=?, close_time=?, close_price=?, pnl_pct=?, rr_ratio=?
           WHERE id=?""",
        (status, now, close_price, round(pnl_pct, 4), rr, trade_id),
    )
    conn.commit()
    conn.close()


def get_open_trades():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM trades WHERE status='OPEN'").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_trades():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM trades ORDER BY entry_time DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]
