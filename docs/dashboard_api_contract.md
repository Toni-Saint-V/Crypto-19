# CryptoBot Pro · Dashboard API Contract

## 1. REST /api/dashboard/snapshot

Method: GET  
URL: `/api/dashboard/snapshot`

### Query params

- symbol (string, default: "BTCUSDT")  
- timeframe (string, default: "15m")  
- mode (string, default: "live")  
  - live — реальные данные, если доступны  
  - test — синтетика для тестового режима  
  - backtest — синтетика для бэктеста  

### Response: DashboardSnapshot (JSON, структура)

- balance: number  
- daily_pnl_pct: number  
- total_profit: number  
- winrate_pct: number  
- active_positions: integer  
- risk_level_pct: number  

- symbol: string  
- timeframe: string  

- candles: array of:
  - time: integer (unix seconds)  
  - open: number  
  - high: number  
  - low: number  
  - close: number  
  - volume: number  

- ai_signals: array of:
  - symbol: string  
  - side: string ("buy" или "sell")  
  - confidence: number (0–100)  
  - entry: number  
  - target: number  
  - stop_loss: number  
  - timeframe: string  
  - comment: string | null  

- trades: array of:
  - id: string  
  - symbol: string  
  - side: string  
  - price: number  
  - qty: number  
  - timestamp: integer (unix seconds)  
  - realized_pnl: number | null  

Гарантии:

- balance, daily_pnl_pct, total_profit, winrate_pct, active_positions,
  risk_level_pct, symbol, timeframe, candles, ai_signals — всегда есть.
- Формат candles и ai_signals синхронизирован с core/dashboard/service.py.
- При отсутствии реальных данных для режима live используется синтетика
  с тем же форматом.

## 2. WebSocket /ws/dashboard

URL: `/ws/dashboard`

### Query params

- symbol (string, default: "BTCUSDT")  
- timeframe (string, default: "15m")  
- mode (string, default: "live")  

Примеры URL:

- ws://127.0.0.1:8000/ws/dashboard?symbol=BTCUSDT&timeframe=15m&mode=live  
- ws://127.0.0.1:8000/ws/dashboard?symbol=BTCUSDT&timeframe=1h&mode=test  

### Сообщения сервера

Периодически отправляется объект:

- type: "dashboard_update"  
- payload: полный DashboardSnapshot в том же формате,
  что и ответ /api/dashboard/snapshot  

## 3. Использование на фронте

1. Начальная загрузка:
   - один запрос к /api/dashboard/snapshot с нужными symbol, timeframe, mode.  
2. Лайв-обновления:
   - WebSocket к /ws/dashboard с теми же параметрами;  
   - на каждом dashboard_update:
     - обновить график по candles;  
     - обновить верхние метрики по числовым полям;  
     - обновить AI-панель по ai_signals;  
     - при необходимости — маркеры сделок по trades.
