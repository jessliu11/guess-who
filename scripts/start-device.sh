#!/bin/bash
# Starts Expo with tunnel for physical device testing (prod Supabase).
# Temporarily disables .env.development.local so the device uses .env.local (prod).
set -e

ENV_LOCAL=".env.development.local"
ENV_OFF=".env.development.local.off"

restore() {
  if [ -f "$ENV_OFF" ] && [ ! -f "$ENV_LOCAL" ]; then
    mv "$ENV_OFF" "$ENV_LOCAL"
  fi
}

# Recover from a prior crash that left .off behind.
if [ -f "$ENV_OFF" ] && [ -f "$ENV_LOCAL" ]; then
  echo "Both $ENV_LOCAL and $ENV_OFF exist — removing stale $ENV_OFF." >&2
  rm "$ENV_OFF"
elif [ -f "$ENV_OFF" ]; then
  echo "Found leftover $ENV_OFF from a previous run — restoring." >&2
  mv "$ENV_OFF" "$ENV_LOCAL"
fi

if [ ! -f "$ENV_LOCAL" ]; then
  echo "Warning: $ENV_LOCAL not found. Simulator dev mode will use $ENV_OFF/.env.local fallback." >&2
fi

trap restore EXIT INT TERM HUP

if [ -f "$ENV_LOCAL" ]; then
  mv "$ENV_LOCAL" "$ENV_OFF"
fi

npx expo start --tunnel --clear "$@"
