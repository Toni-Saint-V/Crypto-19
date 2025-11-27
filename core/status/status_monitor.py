class StatusMonitor:
    def get_status(self):
        # Пока жёсткий мок. Потом сюда подцепим реальные данные из портфеля и стратегии.
        return {
            "status": "ok",
            "mode": "Локальный режим",
            "network": "Testnet mock",
            "equity": 10_000,
            "currency": "USDT",
            "pnl_pct": 2.3,
            "open_trades": 0,
            "strategy": "Three-Candle (demo)"
        }
