from __future__ import annotations
from typing import Sequence
import asyncio
import logging

from core.services.download_bybit import download_klines
from .models import OHLCV
from .provider_base import MarketDataProvider

log = logging.getLogger(__name__)

class BybitMarketDataProvider(MarketDataProvider):
    """Robust Bybit OHLCV provider — supports dict and list formats."""

    async def get_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 500,
        since: int | None = None,
    ) -> Sequence[OHLCV]:

        loop = asyncio.get_event_loop()

        try:
            raw = await loop.run_in_executor(None, download_klines, symbol, timeframe, limit)
        except Exception as e:
            log.error(f"Bybit provider failed to fetch klines: {e}", exc_info=True)
            return []

        if not raw:
            log.warning(f"No candles from Bybit for {symbol} {timeframe}")
            return []

        normalized: list[OHLCV] = []

        for idx, c in enumerate(raw):
            try:
                # LIST FORMAT → [timestamp, open, high, low, close, volume]
                if isinstance(c, (list, tuple)) and len(c) >= 6:
                    t = int(float(c[0]))
                    o = float(c[1])
                    h = float(c[2])
                    l = float(c[3])
                    cl = float(c[4])
                    v = float(c[5])

                # DICT FORMAT → {"open":..., "high":..., ...} or Bybit-style {"o","h","l","c","v"}
                elif isinstance(c, dict):
                    t = int(float(c.get("time") or c.get("timestamp") or c.get("t")))
                    o = float(c.get("open") or c.get("o"))
                    h = float(c.get("high") or c.get("h"))
                    l = float(c.get("low") or c.get("l"))
                    cl = float(c.get("close") or c.get("c"))
                    v = float(c.get("volume") or c.get("v") or 0)

                else:
                    log.warning(f"Unsupported candle format idx={idx}: {c}")
                    continue

                normalized.append(
                    OHLCV(
                        time=t,
                        open=o,
                        high=h,
                        low=l,
                        close=cl,
                        volume=max(0.0, v),
                    )
                )

            except Exception as e:
                log.warning(f"Normalize error idx={idx}: {e}, raw={c}")
                continue

        if not normalized:
            log.warning(f"Normalization failed: no valid candles for {symbol} {timeframe}")
            return []

        # timestamps ASCENDING
        normalized.sort(key=lambda x: x.time)

        # filter by 'since'
        if since is not None:
            normalized = [c for c in normalized if c.time >= since]

        # respect 'limit'
        if limit and len(normalized) > limit:
            normalized = normalized[-limit:]

        return normalized
