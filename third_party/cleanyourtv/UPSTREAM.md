# CleanYourTV integration

Upstream: https://github.com/Gathin23/cleanyourtv
Reference revision: 0c0f69c3f1a50582bedc5569d4536367611ae9ff
Retrieved 2026-10-25. MIT License, full text in LICENSE.

Reused companion recovery / ADB tools, adapted SystemSettings fallback, merged Xiaomi package-candidate lists, and implemented the upstream maintenance workflow and module-card spec 1 in ASTRA's native Java interface. Full feature mapping and limits: [INTEGRATION.md](INTEGRATION.md).

ASTRA keeps its native OpenGL galaxy desktop. No WebView hosts this Android desktop. No original HOME, camera, voice, HDMI, Bluetooth, casting or updater package is disabled automatically. Profile entries for other devices are evidence for review, not validation for this Xiaomi firmware.

The 19 upstream addons are optional separate apps, supported through metadata compatibility, explicit approval and a pinned-source build helper; they are not all bundled into the core APK.
