# Disposable maintenance fixture

`AndroidManifest.xml` declares a no-code application with no permissions and no launchable activity. Its only purpose is to exercise exact enabled-state restoration without touching an actual TV component.

Build and sign locally after the main Android build has created your standard debug keystore:

```sh
# Adjust Android SDK / Java environment for your machine first.
# Use aapt/aapt2 and apksigner from Build Tools 35.0.0.
aapt2 link -I "$ANDROID_SDK_ROOT/platforms/android-35/android.jar" --manifest tests/android-maintenance-fixture/AndroidManifest.xml -o output/maintenance-fixture-unsigned.apk
apksigner sign --ks "$HOME/.android/debug.keystore" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out output/maintenance-fixture.apk output/maintenance-fixture-unsigned.apk
```

Install this fixture only on a development TV where maintenance testing is intended. The native `maintenanceAudit` instrumentation disables only `com.astra.tvhome.fixture` and restores its original enabled state. It requires successful authorization of ASTRA's separate local ADB key. Core metadata checks use the upstream Capacity Stats addon, built with `scripts/build-cleanyourtv-addon.py capacity-stats`.

Inspect the instrumentation source before running it, remove the fixture/test packages afterwards, and retain the device-specific journal privately. Never substitute a real system application as the fixture.
