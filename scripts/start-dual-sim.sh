#!/bin/bash
# Boots two iOS simulators and opens the Expo dev client on both.
# Defaults to iPhone 17 Pro + iPhone 17 Pro Max (good for multiplayer testing).
# Override: DEVICE1_UDID=<udid> DEVICE2_UDID=<udid> npm run start:dual

DEVICE1_UDID="${DEVICE1_UDID:-A8B895B6-7213-44F1-9C2B-E2430C106F33}"  # iPhone 17 Pro
DEVICE2_UDID="${DEVICE2_UDID:-521210B6-C654-496E-B065-3DC2CFC9961E}"  # iPhone 17 Pro Max
METRO_PORT=8081
METRO_URL="exp://127.0.0.1:${METRO_PORT}"

echo "Booting simulators..."
xcrun simctl boot "$DEVICE1_UDID" 2>/dev/null || true
xcrun simctl boot "$DEVICE2_UDID" 2>/dev/null || true
open -a Simulator

echo "Starting Metro bundler..."
npx expo start &
EXPO_PID=$!

cleanup() {
  kill "$EXPO_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Waiting for Metro status..."
until curl -sf "http://127.0.0.1:${METRO_PORT}/status" 2>/dev/null | grep -q "packager-status:running"; do
  sleep 2
done

# Metro says it's running but the JS bundle hasn't been compiled yet.
# Pre-compile it now so Expo Go doesn't time out waiting for the first build.
echo "Pre-compiling bundle (may take 30-60s on first run)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 120 \
  "http://127.0.0.1:${METRO_PORT}/index.bundle?platform=ios&dev=true&minify=false")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "Warning: bundle pre-compile returned HTTP $HTTP_STATUS — opening simulators anyway."
fi

echo "Bundle ready — opening app on both simulators..."
xcrun simctl openurl "$DEVICE1_UDID" "$METRO_URL" 2>&1 || echo "Warning: could not open on device 1"
sleep 2
xcrun simctl openurl "$DEVICE2_UDID" "$METRO_URL" 2>&1 || echo "Warning: could not open on device 2"

echo "Both simulators launched. Press Ctrl+C to stop."
wait "$EXPO_PID"
