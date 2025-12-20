# Contract compliance report (draft)

Generated: 2025-12-20 04:32

Источник правды: docs/CONTRACTS.md

## Цель
Подогнать бизнес-логику и API под контракты так, чтобы UI в каждом режиме (LIVE/TEST/BACKTEST) получал валидные данные и мог стабильно визуализировать их без “заглушек”.

## Входные данные
- OpenAPI (если доступно): OK (http://127.0.0.1:8000/openapi.json)
- Контракты: FOUND (docs/CONTRACTS.md)

## P0 endpoints (минимум)
Нужно обеспечить контрактно-валидные ответы для:
- GET /api/candles
- GET /api/trades
- GET /api/equity
- GET /api/metrics
- (если есть) /api/dashboard/snapshot
- (если есть) /api/ml/score или /api/assistant

## Таблица соответствия (заполнить в процессе фиксов)
| Endpoint | Mode | Contract (expected) | Current behavior | Gap | Fix plan | Status |
|---|---|---|---|---|---|---|
| /api/candles | LIVE/TEST/BACKTEST | CandlesResponse | TODO | TODO | TODO | TODO |
| /api/trades | LIVE/TEST/BACKTEST | TradesResponse | TODO | TODO | TODO | TODO |
| /api/equity | LIVE/TEST/BACKTEST | EquityResponse | TODO | TODO | TODO | TODO |
| /api/metrics | LIVE/TEST/BACKTEST | MetricsResponse | TODO | TODO | TODO | TODO |
| /api/ml/score | LIVE/TEST/BACKTEST | MLScoreResponse | TODO | TODO | TODO | TODO |

## Acceptance criteria (гейты)
1) Все ответы соответствуют контрактам (типы/поля/время epoch ms).
2) TEST и BACKTEST всегда отдают trades+equity+metrics (пусть пустые, но структурно валидные).
3) Любая ошибка — явная: status + message (без “тихих” 422/traceback для UI).
4) Переключение режимов 10 раз подряд не оставляет хвостов состояния/данных.
