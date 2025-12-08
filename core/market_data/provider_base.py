from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, Sequence, Set

from .models import OHLCV


class MarketDataProvider(ABC):
    """Abstract provider for fetching raw OHLCV candles."""

    native_timeframes: Set[str] = frozenset({"1m"})

    @abstractmethod
    async def get_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 500,
        since: int | None = None,
    ) -> Sequence[OHLCV]:
        """
        Fetch OHLCV candles for the requested timeframe.

        Providers should return ascending candles (oldest -> newest).
        """

    def supports_timeframe(self, timeframe: str) -> bool:
        """Return True if provider can natively serve the timeframe."""
        return timeframe in self.native_timeframes

    @staticmethod
    def normalize_payload(payload: Iterable[dict]) -> list[OHLCV]:
        candles: list[OHLCV] = []
        for row in payload:
            candles.append(
                OHLCV(
                    time=int(row["time"]),
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=float(row.get("volume", 0.0)),
                )
            )
        candles.sort(key=lambda c: c.time)
        return candles
