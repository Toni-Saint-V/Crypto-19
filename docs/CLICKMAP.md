# Clickmap (draft)

Generated: 2025-12-20 04:32

## Цель
Зафиксировать всё, что кликается/переключается в UI, и к чему это приводит (state changes + API calls + визуализация).

## Формат записи
- Control: где находится, как называется
- Trigger: событие
- API: какие запросы (endpoint + params)
- States: loading/empty/error/success
- Notes: ограничения по режимам

## Controls list (заполнить)
### Global
- Mode switch: LIVE / TEST / BACKTEST
- Symbol selector
- Timeframe selector

### Chart
- Indicators toggles: EMA50, EMA200, RSI, Equity overlay
- Zoom / crosshair / tooltip (поведение)

### Right panel
- AI Predictor block
- AI Chat (input pinned, scroll внутри)

### Backtest
- Run Backtest
- Bottom drawer: expand/collapse
- Tabs внутри drawer (trades/equity/metrics/logs)

## Route references (если backend живой)
См. docs/ROUTE_INVENTORY.md
