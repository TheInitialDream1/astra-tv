#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p android/app/src/main/assets output/android
cp public/mediapipe/hand_landmarker.task android/app/src/main/assets/hand_landmarker.task
cp public/mediapipe/hand_landmarker_fast.task android/app/src/main/assets/hand_landmarker_fast.task
cp -R public/licenses android/app/src/main/assets/
SDK_PATH="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
[ -d "$SDK_PATH" ] || { echo "Android SDK not found; set ANDROID_SDK_ROOT" >&2; exit 1; }
printf 'sdk.dir=%s\n' "$SDK_PATH" > android/local.properties
GRADLE_BIN="$PWD/android/gradlew"
"$GRADLE_BIN" -p android --no-daemon assembleDebug
cp android/app/build/outputs/apk/debug/app-debug.apk output/android/AstraTV-0.4.0-native-debug.apk
"$SDK_PATH/build-tools/35.0.0/apksigner" verify --verbose output/android/AstraTV-0.4.0-native-debug.apk
