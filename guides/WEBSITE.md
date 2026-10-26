# Website

Source: `website/`. Static build: `npm run build:site` -> ignored `docs/` output.

The `main` branch workflow builds the site, runs browser-logic and maintenance-tool tests, and deploys a GitHub Pages artifact. Configure the repository Pages build type as GitHub Actions. The website uses relative asset paths and works under the `/astra-tv/` project subpath.

The hero shader is adapted from ASTRA's own native galaxy shader. Three.js performs browser rendering; this is a labelled website demonstration rather than an Android benchmark. It includes an explicit pause control, reduced-motion support, viewport/visibility suspension, screenshot tabs, keyboard controls and a modal image viewer. Images are lazy-loaded where appropriate; no camera, analytics, login or external font requests are used by the site.

Screenshot provenance and versions: `website/public/media/README.md`. Source attribution and license: `THIRD_PARTY_NOTICES.md`.
