#!/usr/bin/env bash
# 시뮬레이터에서 예시 데이터(-BentoDemo)로 앱을 띄워 화면을 찍는다. 결과: $1 폴더의 PNG.
#   ci/shots.sh <출력 폴더>
set -euo pipefail
OUT="$1"
mkdir -p "$OUT"
BID="com.vallista.bento.routine"

read -r RUNTIME DEVTYPE < <(xcrun simctl list -j | python3 -c '
import json, sys
d = json.load(sys.stdin)
rts = [r for r in d["runtimes"] if r.get("isAvailable") and r["identifier"].split(".")[-1].startswith("iOS")]
rt = sorted(rts, key=lambda r: [int(x) for x in r["version"].split(".")])[-1]
types = [t["identifier"] for t in d["devicetypes"] if "iPhone" in t["name"]]
pick = next((t for t in types if t.endswith("iPhone-16-Pro")), None) or next((t for t in types if "iPhone-16" in t), types[-1])
print(rt["identifier"], pick)
')
echo "runtime=$RUNTIME device=$DEVTYPE"
DEV=$(xcrun simctl create bento-shots "$DEVTYPE" "$RUNTIME")
xcrun simctl boot "$DEV"
xcrun simctl bootstatus "$DEV" -b >/dev/null

xcodebuild -project BentoRoutine.xcodeproj -scheme BentoRoutine -configuration Debug \
  -destination "id=$DEV" -derivedDataPath build \
  CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY=- DEVELOPMENT_TEAM= \
  build >/tmp/shots-build.log 2>&1 || { tail -40 /tmp/shots-build.log; exit 1; }
APP="build/Build/Products/Debug-iphonesimulator/BentoRoutine.app"

xcrun simctl status_bar "$DEV" override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 || true
xcrun simctl install "$DEV" "$APP"

shot() {
  local name="$1"; shift
  xcrun simctl terminate "$DEV" "$BID" >/dev/null 2>&1 || true
  xcrun simctl launch "$DEV" "$BID" -BentoDemo "$@" >/dev/null
  sleep 5
  xcrun simctl io "$DEV" screenshot "$OUT/$name.png" >/dev/null
  echo "shot $name"
}

xcrun simctl ui "$DEV" appearance light
shot 01-today-light -BentoTab today
shot 02-stats-top -BentoTab stats
shot 03-stats-period -BentoTab stats -BentoScroll period
shot 04-stats-pattern -BentoTab stats -BentoScroll pattern
shot 05-stats-rows -BentoTab stats -BentoScroll rows
shot 06-routines -BentoTab routines
shot 07-settings -BentoTab settings
shot 08-editor -BentoTab today -BentoSheet edit
shot 09-new -BentoTab today -BentoSheet new

# 앱을 뒤로 보내면 다이내믹 아일랜드에 타이머가 남는다
xcrun simctl launch "$DEV" com.apple.Preferences >/dev/null || true
sleep 4
xcrun simctl io "$DEV" screenshot "$OUT/10-island.png" >/dev/null || true

xcrun simctl ui "$DEV" appearance dark
shot 11-today-dark -BentoTab today
shot 12-stats-dark -BentoTab stats
shot 13-stats-period-dark -BentoTab stats -BentoScroll period
shot 14-routines-dark -BentoTab routines

# 저장소에 올리기 좋게 줄인다
for f in "$OUT"/*.png; do sips -Z 1100 "$f" >/dev/null; done
ls -la "$OUT"
