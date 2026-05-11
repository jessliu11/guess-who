#!/bin/bash
# Starts Expo with tunnel for physical device testing (prod Supabase).
# Temporarily disables .env.development.local so the device uses .env.local (prod).
set -e

ENV_LOCAL=".env.development.local"
ENV_OFF=".env.development.local.off"

if [ -f "$ENV_LOCAL" ]; then
  mv "$ENV_LOCAL" "$ENV_OFF"
  trap "mv '$ENV_OFF' '$ENV_LOCAL'" EXIT
fi

npx expo start --tunnel --clear
