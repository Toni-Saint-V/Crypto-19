#!/usr/bin/env bash
set -euo pipefail

port="${PORT:-8010}"
host="${HOST:-127.0.0.1}"
base="http://$host:$port"

get_code() { curl -sS -o /dev/null -w "%{http_code}" "$1" || echo "000"; }
post_code() { curl -sS -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$2" "$1" || echo "000"; }

c1="$(get_code "$base/api/candles?symbol=BTCUSDT&timeframe=1h&limit=5")"
c2="$(get_code "$base/api/trades?symbol=BTCUSDT&timeframe=1h&mode=TEST")"
c3="$(get_code "$base/api/equity?symbol=BTCUSDT&timeframe=1h&mode=TEST")"
c4="$(get_code "$base/api/metrics?symbol=BTCUSDT&timeframe=1h&mode=TEST")"
c5="$(post_code "$base/api/ml/score" '{"symbol":"BTCUSDT","timeframe":"1h","mode":"TEST"}')"

echo "GET /api/candles -> $c1"
echo "GET /api/trades  -> $c2"
echo "GET /api/equity  -> $c3"
echo "GET /api/metrics -> $c4"
echo "POST /api/ml/score -> $c5"

ok="1"
test "$c1" = "200" || ok="0"
test "$c2" = "200" || ok="0"
test "$c3" = "200" || ok="0"
test "$c4" = "200" || ok="0"
test "$c5" = "200" || ok="0"

test "$ok" = "1" || { echo "FAIL: one or more endpoints not 200"; exit 1; }
