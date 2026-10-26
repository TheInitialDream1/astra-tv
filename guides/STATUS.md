# v0.4.0 validation scope

This is an experimental preview, not a completed compatibility certification.

- 19 core maintenance runtime checks passed on Android 9: installed/disabled inventory, system protection, invalid-plan rejection, atomic preference import, app visibility/order, real upstream Capacity Stats metadata/signature, explicit card approval/rejection and bounded file-browser paths.
- Native ADB requested Android authorization but the last connection did not complete successfully. No real advertisement/system package was disabled. The actual native disable/restore cycle remains unverified.
- A previous v0.3.3 native run passed 44 checks for UI/navigation/rendering and local models. That result is historical, not counted as v0.4.0 regression coverage.
- A test television with Mali-G52 supplied a 1920 × 1080 window. Render sampling was roughly in the 30–40 FPS range under tested configurations; it is not a minimum guarantee. Forced 4K was not fluent and was reverted.
- Camera NV21 fallback produced real local inference. Later samples varied around 70–123 ms for the fast GPU model; observed accuracy and responsiveness still need living-room testing. No stable latency guarantee is made.
- All 19 optional upstream addons built, passed APK signature verification and had minimum API metadata compatible with Android 9. Only the Capacity Stats module's metadata/approval integration was exercised; the other addons were not all run on the device.
- Full UI and gesture regression was interrupted by standby and deferred. No user-specific logs, serials, private keys or recovery snapshots are distributed here.

The project's public screenshots retain their capture/version notes in `website/public/media/README.md`. They are not benchmark evidence. To reproduce tests, build the Android test APK and inspect the instrumentation source under `android/app/src/androidTest/`. Maintenance mutation audits use only a dedicated test fixture and require a separately authorized local ADB connection; do not run them against real system packages.
