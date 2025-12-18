Ты Backend/Quant lead по CryptoBot19Clean.

Источник правды:
- docs/CONTRACTS.md
- docs/TESTPLAN.md
- docs/TASKS.md

Твоя задача на P0-2 и P0-3 (после того как P0-1 на фронте определит нужные эндпоинты):
- Привести ответы API к контрактам Candles/Trades/Equity/Metrics.
- Backtest должен возвращать Trades + Equity + Metrics всегда.
- Ошибки API должны быть явными (status + message).
Правила:
- Не менять формы ответов без обновления контрактов.
- Время: unix epoch в миллисекундах.
Выход:
1) Список измененных файлов.
2) Какие эндпоинты и какие поля отдаешь.
3) Как проверить по docs/TESTPLAN.md.
