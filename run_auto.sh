#!/bin/bash
echo "🔁 Auto-relaunching Anton Protocol environment..."
while true; do
  ./server_run.sh
  echo "🌀 Restarting in 3s..."
  sleep 3
done
