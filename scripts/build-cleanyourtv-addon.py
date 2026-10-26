#!/usr/bin/env python3
"""Build selected optional upstream addons at a pinned revision; never installs or changes a TV."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
REVISION = "0c0f69c3f1a50582bedc5569d4536367611ae9ff"
ADDONS = "ad-blocking airplay-status brightness capacity-stats flock frigate-glance headphones photo-prints photo-screensaver prayer-times quiet-hours remote-access sleep-timer smart-home sources tv-hub tv-static weather world-clock".split()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("addons", nargs="+", choices=ADDONS + ["all"])
    parser.add_argument("--maven-mirror", help="Optional HTTPS Maven Central mirror for restricted networks")
    args = parser.parse_args()
    selected = ADDONS if "all" in args.addons else list(dict.fromkeys(args.addons))
    work = ROOT / "output" / "cleanyourtv-addons"
    work.mkdir(parents=True, exist_ok=True)
    archive = work / (REVISION + ".tar.gz")
    source = work / ("cleanyourtv-" + REVISION)
    if not source.is_dir():
        if not archive.exists():
            print("Downloading pinned upstream source", flush=True)
            temporary = archive.with_suffix(".partial")
            with urllib.request.urlopen("https://codeload.github.com/Gathin23/cleanyourtv/tar.gz/" + REVISION, timeout=60) as src, temporary.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            temporary.replace(archive)
        with tarfile.open(archive) as tar:
            tar.extractall(work, filter="data")
    sdk = Path(os.environ.get("ANDROID_SDK_ROOT", os.environ.get("ANDROID_HOME", str(Path.home() / "Library/Android/sdk"))))
    if not sdk.is_dir():
        parser.error("Set ANDROID_SDK_ROOT to your Android SDK directory")
    results = []
    for addon in selected:
        folder = source / "addons" / addon
        (folder / "local.properties").write_text("sdk.dir=" + str(sdk) + "\n")
        if args.maven_mirror:
            import re
            if not re.fullmatch(r"https://[A-Za-z0-9./_-]+", args.maven_mirror):
                parser.error("Mirror must be a plain HTTPS repository URL")
            settings = next(folder.glob("settings.gradle*"))
            content = settings.read_text()
            mirror = 'maven { url = uri("' + args.maven_mirror + '") }; '
            if mirror not in content:
                settings.write_text(content.replace("mavenCentral()", mirror + "mavenCentral()"))
        print("Building " + addon, flush=True)
        log = work / (addon + ".log")
        with log.open("w") as out:
            result = subprocess.run([str(ROOT / "android/gradlew"), "-p", str(folder), "--no-daemon", "assembleDebug"], stdout=out, stderr=subprocess.STDOUT)
        if result.returncode:
            print("Build failed; see " + str(log), flush=True)
            results.append({"addon": addon, "status": "failed", "log": str(log)})
            continue
        apk = folder / "app/build/outputs/apk/debug/app-debug.apk"
        target = work / (addon + "-debug.apk")
        shutil.copy2(apk, target)
        results.append({"addon": addon, "status": "built", "apk": str(target), "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
        print(str(target), flush=True)
    previous = {}
    manifest = work / "builds.json"
    if manifest.exists():
        previous = {r["addon"]: r for r in json.loads(manifest.read_text()).get("builds", [])}
    previous.update({r["addon"]: r for r in results})
    manifest.write_text(json.dumps({"upstream": REVISION, "sourceArchiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "mavenMirror": args.maven_mirror, "builds": [previous[k] for k in sorted(previous)]}, indent=2) + "\n")
    return 1 if any(r["status"] != "built" for r in results) else 0

if __name__ == "__main__":
    raise SystemExit(main())
