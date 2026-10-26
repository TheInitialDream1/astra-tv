# ASTRA v10 · 开源代码来源

## Holographic Material（前版复用，现保留参考文件）

- 作者：Anderson Mancini
- 仓库：https://github.com/ektogamat/threejs-vanilla-holographic-material
- 核对版本：`25d7ce01782ea51a28bbc693aabd5ca36b24683c`
- 原文件：`src/HolographicMaterialVanilla.js`
- 本地文件：`src/vendor/HolographicMaterial.js`
- 完整 MIT 许可：`src/vendor/holographic-material.LICENSE`

保留全息扫描线、Fresnel 与材质参数实现。前版适配了 Three.js 的世界坐标变换、外部时钟、粒子透明叠加，并修正局部变量遮蔽和未定义的 smoothstep 范围。当前不导入该文件，应用星体改用完整品牌轮廓挤出几何、物理材质与本项目编写的粒子表面、边缘光。

## WebGPU Galaxy（移植部分算法）

- 作者：dgreenheck
- 仓库：https://github.com/dgreenheck/webgpu-galaxy
- 核对版本：`abe17570b5ec6640a10e49f462c64309a7fca7c2`
- 原文件：`helpers.js`、`galaxy.js`
- 本地文件：`src/vendor/galaxy-flow.js`
- 完整 MIT 许可：`src/vendor/webgpu-galaxy.LICENSE`

将 TSL 的随机函数、差速旋转、鼠标径向扰动翻译为 GLSL，并参考星系旋臂分布。当前使用 Three.js WebGL 2 顶点着色器，在没有 WebGPU 的浏览器上也可运行；没有照搬上游 WebGPU 计算缓冲区、整套模拟器或贴图。层状体积、应用在体积内部的漂移、朝向、镜头导航、深度合成、远近显现与能量流联动由本项目实现。

## 交互与视觉参考（未复制源代码）

- Iron Interface：https://github.com/collidingScopes/iron-interface
  - 参考手势探索、三维旋转与双手缩放的操作方式。所检查版本没有找到独立许可证，因此没有复制其源码。
- Jarvis Holographic Interface：https://github.com/Minhen96/Jarvis-Holographic-interface
  - 参考粒子聚散、形态变化和手势反馈。README 声明 MIT，但所检查版本没有独立的完整许可文件；本项目没有复制其源码。

## 现有依赖和演示素材

- Three.js、MediaPipe Tasks Vision、Vite：遵循各自 npm 包随附许可。
- Simple Icons：品牌标志轮廓仅用于原型示例；品牌及商标归对应权利人，使用前还应核对各品牌指南。
- 手部检测模型与测试图：Google MediaPipe 官方模型和测试资源。摄像头图像只在本机识别，不发送至上述项目或模型作者。

上游许可证完整文本随复制或移植的代码保存在 `src/vendor/` 中。

## CleanYourTV (Android integration)

- Source: https://github.com/Gathin23/cleanyourtv
- Reference revision: `0c0f69c3f1a50582bedc5569d4536367611ae9ff` (2026-10-25).
- Copyright (c) 2026 Gathin. MIT License; full text in `third_party/cleanyourtv/LICENSE` and APK assets `licenses/cleanyourtv.txt`.
- Adapted `SystemSettings.java` for Android/vendor settings fallback. Original companion ADB/recovery tools retained under `third_party/cleanyourtv/tools/`. Conservative advertisement/statistics candidates derived from Xiaomi examples; actual device validation is still required.
- The CleanYourTV Apple TV interface and Outfit font are not used. The browser prototype and native OpenGL Android launcher are implemented in this project.

## Native Android dependencies

- MediaPipe Tasks Vision Android `0.10.32`, Google, Apache-2.0; full license in `public/licenses/mediapipe-apache-2.0.txt`, included in APK assets. Models run locally. INTERNET permission is used for the user-configured weather service and local loopback ADB transport, never camera images.
- Native volume, particle, icon and postprocessing shaders adapt the existing project scene into GLSL ES 3.0. Android controls, Camera2 acquisition, gestures, application navigation and install recovery are project code.

## Android 0.3.3 additions

- Official MediaPipe Lite palm and hand landmark networks: source URLs and SHA256 in `third_party/mediapipe-lite/SOURCES.json`. Packaging adds Tasks metadata and preserves the original network weights and operators.
- Weather: Open-Meteo (https://open-meteo.com/), CC BY 4.0 data attribution; non-commercial prototype API.
- Warp audio: original procedural synthesis in this project; no third-party sound samples.

## Android 0.4.0 maintenance

- CleanYourTV, MIT, pinned revision above: 172 merged Xiaomi package candidates (not verified for this firmware), recovery and module-card behavior, optional addon catalogue. All standalone addons retain their own source and permissions; a catalogue entry does not mean bundled code.
- AdbLib, Cameron Gutman (2013), BSD-3-Clause, revision `d6937951eb98557c76ee2081e383d50886ce109a`. Full license: `licenses/adblib-bsd-3-clause.txt` in the APK and `third_party/adblib/LICENSE` in source. Modified queue draining, auth callback and key comment.
- Public DNS preset: [AdGuard DNS setup](https://adguard-dns.io/en/public-dns.html), checked 2026-10-25. DNS is never changed without choosing and confirming a plan.

## 官网与开源分发

- 官网的星系效果由本项目原生 `galaxy.frag` 适配到 Three.js，属于官网交互演示，不代表 Android 性能测试。截图来源与版本见 `website/public/media/README.md`。
- Three.js MIT 许可随官网发布于 `licenses/three-mit.txt`，源文件位于 `website/public/licenses/three-mit.txt`。
- Gradle Wrapper 来自 Gradle，脚本原版权头保留，采用 Apache-2.0；完整文本见 `public/licenses/gradle-apache-2.0.txt`。
- ASTRA 自有代码采用根目录 MIT 许可。上游代码、Google 模型和第三方品牌权利不因根许可而转移。
