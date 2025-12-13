# CryptoBot Pro · Dashboard Dev Quickstart

This file explains how to run, stop and debug the CryptoBot Pro dashboard stack.

Project root:
- ~/cryptobot_19_clean

## 1. Start full dev stack (backend + React dashboard)

From project root run:
- cd ~/cryptobot_19_clean
- ./scripts/run_dashboard_dev.sh

What it does:
- activates venv if present
- starts backend "server.py" on port 8000 (logs -> /tmp/cbp_backend.log)
- kills old dev server on port 5173 if any
- starts React/Vite dev server on http://127.0.0.1:5173 (logs -> /tmp/cbp_vite.log)
- opens http://127.0.0.1:5173 in browser

Main URL for the new dashboard UI:
- http://127.0.0.1:5173

Old HTML dashboard (optional, legacy):
- http://127.0.0.1:8000/dashboard

## 2. Stop dev stack

From project root run:
- cd ~/cryptobot_19_clean
- ./scripts/stop_dashboard_dev.sh

What it does:
- finds and kills "server.py" processes
- finds and kills any process that uses port 5173 (React dev server)
- prints a short summary to the terminal

## 3. Collect logs for debugging

From project root run:
- cd ~/cryptobot_19_clean
- ./scripts/collect_dashboard_logs.sh

What it does:
- copies /tmp/cbp_backend.log and /tmp/cbp_vite.log
- saves them into ~/Desktop/_CBP_logs/logs_YYYY-MM-DD_HH-MM-SS/
- creates info.txt with basic context

You can zip that folder and send it to a developer or AI assistant.

## 4. Typical workflow

1) Start stack:
- cd ~/cryptobot_19_clean
- ./scripts/run_dashboard_dev.sh

2) Work with the React dashboard at:
- http://127.0.0.1:5173

3) If something breaks:
- run ./scripts/collect_dashboard_logs.sh
- inspect logs in ~/Desktop/_CBP_logs/... or share them

4) When done:
- cd ~/cryptobot_19_clean
- ./scripts/stop_dashboard_dev.sh
