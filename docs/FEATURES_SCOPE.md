# Features Scope (то самое "со всеми прибамбасами")

## Обязательное (Итерация 1: P0)
- Режимы Backtest/Test/Live: строгая изоляция данных, reset/init при переключении.
- No page scroll: весь экран 100vh.
- Chart hero: всегда видим.
- Chat справа: фикс ширина, messages scroll внутри, input pinned.
- Backtest results: только bottom drawer (collapsed by default), max-height, внутренний scroll.
- Trades/Logs/Raw: живут внутри drawer или внутренних областей, без page scroll.
- Метрики: нормальные empty/loading/error states (не "0.00" как данные).

## Аналитика (после стабилизации P0)
- Monte Carlo (обязательно): iterations/method/horizon + histogram + fan chart + risk KPIs (VaR/CVaR/ruin/drawdown percentiles).
- Walk-forward (опционально следующий шаг): разбиение на окна и сводка стабильности.
- Parameter optimizer (stub -> real): grid/random/bayes позже; сначала UI и контракт.

## AI Assistant (MVP)
- TradingContext: mode, symbol, tf, risk, positions, recentTrades, metrics, backtestResult.
- POST /api/assistant: messages + context -> answer + actions.
- Actions в UI: Explain drawdown, Why entries, Optimize params, Risk warnings.

## ML Skeleton
- engine/ml: features -> scoring -> output.
- UI hook: Signal Quality / Risk Score + explain stub.

## Полировка продукта
- Единая система отступов/радиусов/типографики.
- Убрать dev-тексты из пользовательского UI (только tooltip/raw/dev badge).
