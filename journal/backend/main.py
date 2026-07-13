"""
POC Journal — Backend
Recebe webhooks do TradingView, regista paper trades, monitoriza TP/SL via Bybit API.
"""
import asyncio
import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from database import init_db, insert_trade, get_all_trades, get_open_trades
from tracker import run_tracker

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    asyncio.create_task(run_tracker())
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/webhook")
async def receive_webhook(request: Request):
    # Verificação de segredo opcional
    secret = request.headers.get("X-Webhook-Secret", "")
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    raw = await request.body()
    text = raw.decode("utf-8").strip()

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail=f"JSON inválido: {text[:200]}")

    side = payload.get("side", "").upper()
    ticker = payload.get("ticker", "").upper()
    entry = float(payload.get("entry", 0))
    tp = float(payload.get("tp", 0))
    sl = float(payload.get("sl", 0))
    timeframe = payload.get("timeframe", "30m")

    if not side or not ticker or entry <= 0 or tp <= 0 or sl <= 0:
        raise HTTPException(status_code=400, detail="Campos obrigatórios em falta ou inválidos")

    if side not in ("LONG", "SHORT"):
        raise HTTPException(status_code=400, detail="side deve ser LONG ou SHORT")

    trade_id = insert_trade(ticker, side, entry, tp, sl, timeframe)
    print(f"[WEBHOOK] Novo setup: #{trade_id} {ticker} {side} entry={entry} tp={tp} sl={sl}")

    return JSONResponse({"ok": True, "trade_id": trade_id})


@app.get("/api/trades")
async def list_trades():
    return get_all_trades()


@app.get("/api/stats")
async def get_stats():
    trades = get_all_trades()
    closed = [t for t in trades if t["status"] != "OPEN"]
    wins = [t for t in closed if t["status"] == "TP_HIT"]
    losses = [t for t in closed if t["status"] == "SL_HIT"]

    total_pnl = sum(t["pnl_pct"] or 0 for t in closed)
    gross_profit = sum(t["pnl_pct"] for t in wins if t["pnl_pct"])
    gross_loss = abs(sum(t["pnl_pct"] for t in losses if t["pnl_pct"]))
    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else None

    wr = round(len(wins) / len(closed) * 100, 1) if closed else 0

    # Equity curve (paper money, começa em 1000 USDT, posição de 10%)
    equity = 1000.0
    curve = [{"t": "start", "eq": equity}]
    for t in sorted(closed, key=lambda x: x["close_time"] or ""):
        pnl = (t["pnl_pct"] or 0) / 100 * equity * 0.10
        equity += pnl
        curve.append({"t": t["close_time"], "eq": round(equity, 2), "pnl": round(pnl, 2)})

    return {
        "total": len(trades),
        "open": len([t for t in trades if t["status"] == "OPEN"]),
        "closed": len(closed),
        "wins": len(wins),
        "losses": len(losses),
        "win_rate": wr,
        "profit_factor": profit_factor,
        "total_pnl_pct": round(total_pnl, 2),
        "equity_curve": curve,
    }


@app.get("/api/open")
async def open_trades():
    return get_open_trades()


# Serve o dashboard (frontend/index.html)
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
