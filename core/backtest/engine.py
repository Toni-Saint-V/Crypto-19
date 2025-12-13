from __future__ import annotations

"""
Backtest engine for CryptoBot Pro.

This implementation is intentionally self-contained and robust:
- works only with OHLCV candles returned by core.backtest.loader.load_dataset
- does not depend on any concrete strategy modules
- returns simple dictionaries that are easy to serialize to JSON
- exposes a small public surface: BacktestEngine.run(...) and
  BacktestEngine.get_available_strategies()
"""

from dataclasses import asdict
from typing import Any, Dict, List, Optional

import logging

import numpy as np
import pandas as pd

from core.backtest.loader import load_dataset
from core.backtest.diagnostics import diagnose
from core.backtest.types import BacktestConfig, Trade, BacktestSummary
from core.risk.risk_manager import RiskLimits, RiskManager

log = logging.getLogger(__name__)


class BacktestEngine:
    """
    Simple but complete backtest engine.

    It uses a MA-based engine under the hood and exposes a small registry
    of strategy "flavours" which are just different parameter presets.
    """

    def __init__(self, risk_limits: Optional[RiskLimits] = None) -> None:
        self.risk_limits = risk_limits or RiskLimits()
        self.risk_manager = RiskManager(self.risk_limits)
        self._strategies: Dict[str, Dict[str, Any]] = self._build_strategy_registry()

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def get_available_strategies(self) -> List[Dict[str, Any]]:
        """
        Return list of available strategies for the UI.

        Each item is a dict with:
        - id: internal id (used in requests)
        - name: human readable name
        - description: short explanation
        - params: suggested default params
        """
        return list(self._strategies.values())

    def run(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "15m",
        strategy: str = "pattern3_extreme",
        risk_per_trade: float = 100.0,
        rr_ratio: float = 4.0,
        limit: int = 500,
    ) -> Dict[str, Any]:
        """
        Run backtest.

        Returns:
            dict with keys:
            - symbol
            - timeframe
            - strategy
            - params
            - trades: list[dict]
            - summary: dict with metrics
            - diagnostics: dict
        """
        try:
            if risk_per_trade <= 0:
                raise ValueError("risk_per_trade must be > 0")

            config = BacktestConfig(
                symbol=symbol,
                interval=interval,
                risk_per_trade=risk_per_trade,
                rr_ratio=rr_ratio,
                limit=limit,
                strategy=strategy,
            )

            raw_candles = load_dataset(symbol=symbol, interval=interval, limit=limit)
            if not raw_candles:
                return {
                    "error": "No candles returned from data loader",
                    "symbol": symbol,
                    "strategy": strategy,
                    "timeframe": interval,
                }

            df = self._to_dataframe(raw_candles)
            if len(df) < 50:
                return {
                    "error": "Not enough candles for backtest (need at least 50)",
                    "symbol": symbol,
                    "strategy": strategy,
                    "timeframe": interval,
                }

            strategy_id = strategy or "pattern3_extreme"
            strat_cfg = self._strategies.get(strategy_id)
            if strat_cfg is None:
                log.warning("Unknown strategy %s, falling back to pattern3_extreme", strategy_id)
                strategy_id = "pattern3_extreme"
                strat_cfg = self._strategies[strategy_id]

            trades = self._run_ma_based_engine(
                df=df,
                config=config,
                flavour=strat_cfg.get("flavour", "mean_reversion"),
            )

            summary = self._compute_summary(trades, config)
            diagnostics = diagnose(data=df)

            result: Dict[str, Any] = {
                "symbol": symbol,
                "timeframe": interval,
                "strategy": strategy_id,
                "params": {
                    "risk_per_trade": risk_per_trade,
                    "rr_ratio": rr_ratio,
                    "limit": limit,
                },
                "trades": [asdict(t) for t in trades],
                "summary": asdict(summary),
                "diagnostics": diagnostics,
            }
            return result
        except Exception as exc:
            log.exception("Backtest failed: %s", exc)
            return {
                "error": str(exc),
                "symbol": symbol,
                "strategy": strategy,
                "timeframe": interval,
            }

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _build_strategy_registry(self) -> Dict[str, Dict[str, Any]]:
        """
        Define a small registry of backtest "strategies".

        All of them are implemented via the same MA-based engine with different
        flavours, but the UI can treat them as separate strategies.
        """
        return {
            "pattern3_extreme": {
                "id": "pattern3_extreme",
                "name": "Pattern-3 Extreme (Mean Reversion)",
                "description": "Buys after sharp selloffs, takes profit on rebounds.",
                "flavour": "mean_reversion",
                "params": {
                    "fast_ma": 14,
                    "slow_ma": 50,
                },
            },
            "ma_trend_follow": {
                "id": "ma_trend_follow",
                "name": "MA Trend Follow",
                "description": "Classic moving average trend-following strategy.",
                "flavour": "trend",
                "params": {
                    "fast_ma": 20,
                    "slow_ma": 50,
                },
            },
            "breakout_basic": {
                "id": "breakout_basic",
                "name": "Breakout Basic",
                "description": "Breakouts of recent highs/lows with fixed stops.",
                "flavour": "breakout",
                "params": {
                    "lookback": 20,
                },
            },
        }

    @staticmethod
    def _to_dataframe(raw_candles: Any) -> pd.DataFrame:
        """
        Normalize raw candles to DataFrame with OHLCV columns and numeric time.
        """
        if isinstance(raw_candles, pd.DataFrame):
            df = raw_candles.copy()
        else:
            df = pd.DataFrame(raw_candles)

        column_map: Dict[str, str] = {}
        for col in df.columns:
            lc = str(col).lower()
            if lc in {"t", "time", "timestamp"}:
                column_map[col] = "time"
            elif lc.startswith("o"):
                column_map[col] = "open"
            elif lc.startswith("h"):
                column_map[col] = "high"
            elif lc.startswith("l"):
                column_map[col] = "low"
            elif lc.startswith("c"):
                column_map[col] = "close"
            elif lc.startswith("v"):
                column_map[col] = "volume"

        if column_map:
            df = df.rename(columns=column_map)

        required = ["time", "open", "high", "low", "close"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing OHLC columns in candles: {missing}")

        df = df.sort_values("time").reset_index(drop=True)

        for col in ["open", "high", "low", "close", "volume"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        df["time"] = pd.to_numeric(df["time"], errors="coerce").astype("int64")
        df = df.dropna(subset=["open", "high", "low", "close"])

        return df

    def _run_ma_based_engine(
        self,
        df: pd.DataFrame,
        config: BacktestConfig,
        flavour: str = "mean_reversion",
    ) -> List[Trade]:
        """
        Core backtest loop.

        Uses a simplified execution model:
        - only one position at a time
        - entries on MA cross / breakout depending on flavour
        - exits on stop, target, or opposite signal / timeout
        """
        close = df["close"].values
        high = df["high"].values
        low = df["low"].values
        times = df["time"].values

        fast_ma_len = 14
        slow_ma_len = 50

        if flavour == "trend":
            fast_ma_len = 20
            slow_ma_len = 50
        elif flavour == "breakout":
            fast_ma_len = 10
            slow_ma_len = 30  # not directly used, but keeps flavour shape

        fast_ma = pd.Series(close).rolling(fast_ma_len).mean().values
        slow_ma = pd.Series(close).rolling(slow_ma_len).mean().values

        trades: List[Trade] = []
        in_position = False
        direction = "long"
        entry_price = 0.0
        entry_time = 0
        stop_price = 0.0
        target_price = 0.0
        max_fav = 0.0
        max_adv = 0.0
        bars_in_trade = 0
        trade_id = 1

        risk_amount = config.risk_per_trade
        rr_ratio = config.rr_ratio
        max_bars = config.max_bars_in_trade

        def open_long(idx: int) -> None:
            nonlocal in_position, direction, entry_price, entry_time
            nonlocal stop_price, target_price, max_fav, max_adv, bars_in_trade

            in_position = True
            direction = "long"
            entry_price_local = float(close[idx])
            entry_time_local = int(times[idx])

            stop_offset = entry_price_local * 0.01
            if stop_offset <= 0:
                stop_offset = max(1.0, entry_price_local * 0.005)

            local_stop = entry_price_local - stop_offset
            local_target = entry_price_local + stop_offset * rr_ratio

            entry_price = entry_price_local
            entry_time = entry_time_local
            stop_price = local_stop
            target_price = local_target
            max_fav = 0.0
            max_adv = 0.0
            bars_in_trade = 0

        def close_trade(idx: int, exit_price: float, reason: str) -> None:
            nonlocal in_position, trade_id
            nonlocal entry_price, entry_time, stop_price, target_price
            nonlocal max_fav, max_adv, bars_in_trade

            if not in_position:
                return

            exit_time = int(times[idx])
            risk_per_unit = entry_price - stop_price
            if risk_per_unit <= 0:
                risk_per_unit = max(entry_price * 0.005, 1.0)

            if direction == "long":
                result_R = (exit_price - entry_price) / risk_per_unit
            else:
                result_R = (entry_price - exit_price) / risk_per_unit

            pnl_value = float(result_R * risk_amount)

            trade = Trade(
                id=trade_id,
                symbol=config.symbol,
                direction=direction,
                entry_time=entry_time,
                exit_time=exit_time,
                entry_price=float(entry_price),
                exit_price=float(exit_price),
                size=float(risk_amount / risk_per_unit),
                risk_R=1.0,
                result_R=float(result_R),
                pnl=pnl_value,
                max_favorable_excursion=float(max_fav),
                max_adverse_excursion=float(max_adv),
                stop=float(stop_price),
                target=float(target_price),
            )
            trades.append(trade)
            trade_id += 1

            in_position = False
            entry_price = 0.0
            entry_time = 0
            stop_price = 0.0
            target_price = 0.0
            max_fav = 0.0
            max_adv = 0.0
            bars_in_trade = 0

        for i in range(len(df)):
            price = close[i]
            hi = high[i]
            lo = low[i]

            if np.isnan(price):
                continue

            if in_position:
                bars_in_trade += 1

                if direction == "long":
                    fav_move = hi - entry_price
                    adv_move = entry_price - lo
                else:
                    fav_move = entry_price - lo
                    adv_move = hi - entry_price

                max_fav = max(max_fav, fav_move)
                max_adv = max(max_adv, adv_move)

                if direction == "long":
                    if lo <= stop_price:
                        close_trade(i, stop_price, "stop")
                        continue
                    if hi >= target_price:
                        close_trade(i, target_price, "target")
                        continue
                else:
                    if hi >= stop_price:
                        close_trade(i, stop_price, "stop")
                        continue
                    if lo <= target_price:
                        close_trade(i, target_price, "target")
                        continue

                if bars_in_trade >= max_bars:
                    close_trade(i, price, "timeout")
                    continue

            if not in_position and i > slow_ma_len:
                if flavour in {"trend", "mean_reversion"}:
                    prev_fast = fast_ma[i - 1]
                    prev_slow = slow_ma[i - 1]
                    curr_fast = fast_ma[i]
                    curr_slow = slow_ma[i]

                    if (
                        np.isnan(prev_fast)
                        or np.isnan(prev_slow)
                        or np.isnan(curr_fast)
                        or np.isnan(curr_slow)
                    ):
                        continue

                    if flavour == "trend":
                        if prev_fast <= prev_slow and curr_fast > curr_slow:
                            open_long(i)
                            continue
                    else:
                        dist = (curr_slow - price) / curr_slow if curr_slow else 0.0
                        if dist > 0.02 and price > curr_fast and prev_fast <= prev_slow:
                            open_long(i)
                            continue
                elif flavour == "breakout":
                    lookback = 20
                    if i > lookback:
                        recent_high = float(np.max(high[i - lookback : i]))
                        if price > recent_high:
                            open_long(i)
                            continue

        return trades

    def _compute_summary(self, trades: List[Trade], config: BacktestConfig) -> BacktestSummary:
        if not trades:
            return BacktestSummary(
                total_trades=0,
                wins=0,
                losses=0,
                winrate_pct=0.0,
                gross_profit=0.0,
                gross_loss=0.0,
                net_profit=0.0,
                profit_factor=0.0,
                max_drawdown=0.0,
                max_drawdown_pct=0.0,
                average_R=0.0,
                average_win_R=0.0,
                average_loss_R=0.0,
            )

        risk_amount = config.risk_per_trade
        results_R = np.array([t.result_R for t in trades], dtype=float)
        pnl = results_R * risk_amount

        total_trades = len(trades)
        wins_mask = results_R > 0
        losses_mask = results_R < 0

        wins = int(wins_mask.sum())
        losses = int(losses_mask.sum())

        gross_profit = float(pnl[wins_mask].sum()) if wins > 0 else 0.0
        gross_loss = float(pnl[losses_mask].sum()) if losses > 0 else 0.0
        net_profit = float(pnl.sum())

        profit_factor = 0.0
        if gross_loss < 0:
            profit_factor = gross_profit / abs(gross_loss) if gross_loss != 0 else 0.0

        winrate_pct = float(wins / total_trades * 100.0) if total_trades else 0.0

        equity = np.cumsum(pnl) + 10000.0
        peak = np.maximum.accumulate(equity)
        drawdown = peak - equity
        drawdown_pct = drawdown / peak * 100.0

        max_dd = float(drawdown.max()) if total_trades else 0.0
        max_dd_pct = float(drawdown_pct.max()) if total_trades else 0.0

        avg_R = float(results_R.mean())
        avg_win_R = float(results_R[wins_mask].mean()) if wins > 0 else 0.0
        avg_loss_R = float(results_R[losses_mask].mean()) if losses > 0 else 0.0

        return BacktestSummary(
            total_trades=total_trades,
            wins=wins,
            losses=losses,
            winrate_pct=winrate_pct,
            gross_profit=gross_profit,
            gross_loss=gross_loss,
            net_profit=net_profit,
            profit_factor=profit_factor,
            max_drawdown=max_dd,
            max_drawdown_pct=max_dd_pct,
            average_R=avg_R,
            average_win_R=avg_win_R,
            average_loss_R=avg_loss_R,
        )
