#!/usr/bin/env bash
set -euo pipefail
BASE=$(grep -E ^EXPO_PUBLIC_API_BASE= .env.local | cut -d= -f2-)
pp(){ node -e "let s=;process.stdin.on(data,d=>s+=d).on(end,()=>{try{console.log(JSON.stringify(JSON.parse(s),null,2))}catch{console.log(s)}})"; }
echo "Using EXPO_PUBLIC_API_BASE=$BASE"

echo "--- proxy _health ---"
curl -sS "${BASE%/api/circle}/api/circle/_health" | pp

echo "--- proxy _selfcheck (hits wallets) ---"
curl -sS "${BASE%/api/circle}/api/circle/_selfcheck" | pp

echo "--- wallets (200 JSON expected) ---"
curl -sS -i "$BASE/wallets" | awk "NR==1 || tolower($0) ~ /^content-type:/{print; exit}"
