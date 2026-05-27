#!/bin/bash
# Starts Expo in LAN mode for physical device testing (prod Supabase).
# Use this when the test device is on the same Wi-Fi as the Mac — much faster
# and more reliable than tunnel mode for large bundles.
#
# Temporarily disables .env.development.local so the device uses .env.local (prod).
# Overrides Expo's LAN-IP auto-detection (which picks the wrong interface when
# VPN-style utun interfaces are active) with the Mac's actual Wi-Fi IP.
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
  echo "Warning: $ENV_LOCAL not found." >&2
fi

# Detect current Wi-Fi IP (en0). Falls back to en1 if en0 has no IP.
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$LAN_IP" ]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "$LAN_IP" ]; then
  echo "Could not detect Wi-Fi IP on en0 or en1. Is Wi-Fi connected?" >&2
  exit 1
fi
echo "Advertising LAN IP: $LAN_IP" >&2

trap restore EXIT INT TERM HUP

if [ -f "$ENV_LOCAL" ]; then
  mv "$ENV_LOCAL" "$ENV_OFF"
fi

REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --lan --clear "$@"
