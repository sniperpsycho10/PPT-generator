#!/bin/bash
echo "Starting resilient tunnel..."
while true; do
  npx -y localtunnel --port 4000 --subdomain jspl-tunnel-live
  echo "Tunnel crashed, restarting in 2 seconds..."
  sleep 2
done
