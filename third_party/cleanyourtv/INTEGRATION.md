# CleanYourTV integration in ASTRA 0.4.0

Reference: [Gathin23/cleanyourtv](https://github.com/Gathin23/cleanyourtv/tree/0c0f69c3f1a50582bedc5569d4536367611ae9ff), MIT, retrieved 2026-10-25.

The main screen remains ASTRA's native OpenGL galaxy. CleanYourTV's maintenance workflow and module-card protocol are integrated into the native television interface. The upstream launcher is not installed alongside ASTRA.

| Capability | ASTRA behavior |
| --- | --- |
| Ad / recommendation and telemetry candidates | 172 merged package candidates from 30 upstream Xiaomi profiles plus conservative name matching. Current installed state is read from the TV. No exact profile exists for this TV/firmware, so every plan is previewed and selected manually. |
| Disable instead of remove | `pm disable-user --user 0`; no uninstall or clearing data. Core Android, original launcher, camera, HDMI / TV-input hardware, network and installer components are protected. |
| Backup | Firmware, installed / disabled package lists, HOME and system / secure / global settings. APK backup can copy base and split APKs; app account data is not backed up. |
| Recovery | Atomic private journal and an external record / shell rollback script are saved before a mutation. Package enabled states 0–4 are restored exactly, preserving previously disabled apps. DNS and HOME have their own operations. Identity and firmware must match. |
| Firmware-update check | Reports current enabled states against latest applied records. Different-firmware records require a new review; no blind automatic reapplication. |
| Privacy / microphone | Read-only voice-service and relevant RECORD_AUDIO AppOps report. An allowed permission is not evidence of recording. Optional services are disabled only through an explicit package plan. |
| Default HOME | Explicit set / restore, separately journaled. The stock launcher remains installed and enabled. No change is made during normal installation. |
| DNS filtering | Optional Android 9+ private DNS modes and hostname preset, confirmed and journaled. DNS cannot remove same-domain video ads. The upstream ad-blocking addon is separately a Pi-hole / AdGuard Home dashboard. |
| App library and tile menu | Native 5:3 rectangular cards, 4–7 columns, app details, 4–7 shortcuts, ordered traversal and hide-from-space without disabling the app. Optional dedicated Live TV app and once-per-boot open-on-start selection. |
| Motion / statistics / date | Reduced motion, ambient pause, optional memory / storage / FPS and date; no background statistics polling. |
| Settings / themes | Native visible choices plus JSON import / export for compatible dock, order, hidden-app, columns, motion, module and idle-clock fields. ASTRA retains the user's galaxy, so upstream wallpaper/layout replacement is intentionally not applied. This is not full upstream theme-file parity. |
| Remote | Input, settings, navigation, OK and Back handled natively. Four spare colour keys support tap / hold actions and apps. Optional user-enabled accessibility filtering extends those shortcuts outside ASTRA; vendor-specific app keys are not universally remappable. |
| Clock | Drifting clock as both an in-app idle screen and a system DreamService. Screen-saver selection remains an explicit Android setting. |
| Module cards | Spec 1: bounded metadata, exported Leanback entry, reserved-name / conflict checks, SHA-256 signer-bound decisions, 8 shown / 32 scanned / 128 decisions. Approval is explicit under Extensions. Ordinary apps remain launchable without card approval. |
| Addons | All 19 upstream addons are catalogued, with installed state, source / permission information and APK selection. They remain optional independent applications. They are not all bundled, installed or tested by adding the catalogue. |
| Language | Current ASTRA UI is Simplified Chinese. The upstream launcher's 25-language / RTL resource set is not ported. |

## Local ADB authorization

ASTRA generates a separate key in its private app directory and connects only to 127.0.0.1:5555. Android must independently approve this key. Approval of the development computer is not approval of the TV app. No computer private key is copied. Closing ASTRA's connection does not disable the TV's ADB server.

## Files on TVs without a document picker

Some tested firmware has no Android document picker. ASTRA falls back to its own native browser limited to `/sdcard/Download/`, using the authorized local ADB connection. Exported settings go to `Download/AstraTV-Recovery/settings/astra-settings.json`. Imported cleanup lists are previewed and validated before any operation. Imported settings never execute commands.

## Optional addon builds

The upstream repository does not publish prebuilt addon APKs. Build selected addon source at the pinned revision:

```sh
JAVA_HOME=/path/to/jdk python3 scripts/build-cleanyourtv-addon.py capacity-stats
# Or explicitly build all 19:
JAVA_HOME=/path/to/jdk python3 scripts/build-cleanyourtv-addon.py all
```

For this network, the Media3-based addons required Maven Central mirroring: `--maven-mirror https://maven.aliyun.com/repository/central`. This changes build repository configuration in the extracted working copy only. All 19 debug APKs built and passed apksigner verification; this is not a claim that all 19 run correctly on this Xiaomi firmware.

The helper downloads the pinned source to `output/cleanyourtv-addons/`, builds and records APK checksums. It never installs or grants permissions. Choose an APK in Extensions, accept Android's installation confirmation, then approve its module card. Modules needing Home Assistant, Frigate, Pi-hole, photos or a playlist require the owner's separate configuration.

## Recovery scope

Restore reverses the changes recorded by ASTRA; it is not a factory image or a backup of third-party application account data. Device-specific pre-install recovery materials stay in each owner’s ignored local output directory and are not distributed. No real TV package is disabled as part of automated validation. An isolated test fixture is used for disable/restore verification, only after native ADB authorization succeeds.

Optional addon APKs can be copied into the television Download directory and selected in ASTRA. Nothing is automatically enabled or granted permissions.
