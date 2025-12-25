# Mode matrix (draft)

Generated: 2025-12-20 04:32

## Цель
Жёстко зафиксировать, что доступно и как работает в LIVE/TEST/BACKTEST. Никаких “протечек” между режимами.

## Матрица
| Feature | LIVE | TEST | BACKTEST | Notes |
|---|---|---|---|---|
| View candles | yes | yes | yes | /api/candles |
| View trades | yes | yes (sim) | yes (result) | /api/trades or backtest payload |
| View equity | yes | yes | yes | /api/equity |
| View metrics | yes | yes | yes | /api/metrics |
| Place orders | guarded | no | no | LIVE only, risk guardrails |
| Run backtest | no | no | yes | triggers backtest engine |
| Backtest drawer | no | no | yes | collapsed by default |
| AI score | yes | yes | yes | /api/ml/score |
| AI chat | yes | yes | yes | /api/assistant |

## Gate tests
- 10x переключение режимов подряд: нет хвостов данных, UI всегда консистентен.
