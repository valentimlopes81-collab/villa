"""
Monitoriza os trades abertos e fecha-os quando o TP ou SL é atingido.
Usa a API pública da Bybit (sem chaves de API).
"""
import asyncio
import httpx
from database import get_open_trades, close_trade

BYBIT_URL = "https://api.bybit.com/v5/market/tickers"
CHECK_INTERVAL = 30  # segundos


def normalize_symbol(ticker: str) -> str:
    """Converte BTCUSDT.P -> BTCUSDT para a API da Bybit."""
    return ticker.replace(".P", "").replace("PERP", "").upper()


async def get_price(symbol: str, client: httpx.AsyncClient) -> float | None:
    sym = normalize_symbol(symbol)
    try:
        r = await client.get(
            BYBIT_URL,
            params={"category": "linear", "symbol": sym},
            timeout=5,
        )
        data = r.json()
        items = data.get("result", {}).get("list", [])
        if items:
            return float(items[0]["lastPrice"])
    except Exception:
        pass
    return None


async def check_trades():
    async with httpx.AsyncClient() as client:
        trades = get_open_trades()
        if not trades:
            return
        for trade in trades:
            price = await get_price(trade["ticker"], client)
            if price is None:
                continue

            side = trade["side"]
            tp = trade["tp_price"]
            sl = trade["sl_price"]
            tid = trade["id"]

            if side == "LONG":
                if price >= tp:
                    close_trade(tid, price, "TP_HIT")
                    print(f"[TRACKER] Trade #{tid} {trade['ticker']} LONG → TP HIT @ {price}")
                elif price <= sl:
                    close_trade(tid, price, "SL_HIT")
                    print(f"[TRACKER] Trade #{tid} {trade['ticker']} LONG → SL HIT @ {price}")
            else:  # SHORT
                if price <= tp:
                    close_trade(tid, price, "TP_HIT")
                    print(f"[TRACKER] Trade #{tid} {trade['ticker']} SHORT → TP HIT @ {price}")
                elif price >= sl:
                    close_trade(tid, price, "SL_HIT")
                    print(f"[TRACKER] Trade #{tid} {trade['ticker']} SHORT → SL HIT @ {price}")


async def run_tracker():
    print(f"[TRACKER] Iniciado — a verificar a cada {CHECK_INTERVAL}s")
    while True:
        try:
            await check_trades()
        except Exception as e:
            print(f"[TRACKER] Erro: {e}")
        await asyncio.sleep(CHECK_INTERVAL)
