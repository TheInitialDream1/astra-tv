# ASTRA TV / 星穹

A native Android TV launcher with a living galaxy: apps appear as stars at a distance and resolve into readable application cards as the camera approaches.

[Website](https://theinitialdream1.github.io/astra-tv/) · [APK releases](https://github.com/TheInitialDream1/astra-tv/releases) · [中文](README.md)

![Native ASTRA home screen](website/public/media/home.png)

Android uses Java, OpenGL ES 3 and on-device MediaPipe inference, without a WebView. The repository also contains an independent Three.js prototype and the marketing website.

Features include continuous evolving galaxy surfaces, differential rotation, volumetric stellar points, icon-derived app-galaxy colours, remote navigation with automatic camera travel, an internal app library, configurable shortcuts/weather/audio and experimental hand gestures. CleanYourTV-inspired maintenance provides explicit plans, package-state journals, restoration and optional module-card compatibility.

**v0.4.0 is an experimental preview.** The tested Android 9 TV supplied a 1080p app window; native 4K and stable 60 FPS are not promised. Gesture accuracy and hardware compatibility remain under development. Nineteen core maintenance runtime checks passed; the actual native disable/restore cycle still requires device verification. No real system packages were disabled by default. Nineteen optional addons built, but were not all runtime-tested. See [validation scope](guides/STATUS.md).

## Development

Node.js 22.12+:

```sh
npm ci
npm run prepare:assets
npm run dev             # Browser prototype
npm run dev:site        # Website
npm run build:site      # Static site -> docs/
```

Android additionally needs JDK 17+, Android SDK 35 and Build Tools 35.0.0:

```sh
npm run build:android
```

Keep the original launcher and create a device-specific backup before installing or applying maintenance changes. [Android guide](android/README.md).

## Thanks and license

Special thanks to [CleanYourTV](https://github.com/Gathin23/cleanyourtv) and its contributors for reversible maintenance workflows, community package lists and module-card specifications. The native galaxy desktop is ASTRA's own implementation. Reuse scope, original authors and complete upstream licenses remain in [third_party/cleanyourtv](third_party/cleanyourtv/).

Also thanks to Three.js, MediaPipe, AdbLib, WebGPU Galaxy and Holographic Material. [Third-party notices](THIRD_PARTY_NOTICES.md).

ASTRA's own code is MIT licensed. Dependencies, models, third-party code and trademarks retain their own rights. Screenshots are versioned UI records, not generated mockups or benchmark guarantees.
