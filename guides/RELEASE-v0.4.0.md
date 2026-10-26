# ASTRA 星穹 v0.4.0 · 首个公开预览版

原生 Android TV 星云桌面，主代码以 MIT 许可开放。

- 连续星盘、蓝青外臂与暖色核心，差速旋转和内部云气流动。
- 空间应用远近显现、自动镜头导航、穿梭反馈及本机应用启动。
- 原生应用库、信号源、设置，应用排序与隐藏、快捷栏、可配置天气与音效。
- 实验性摄像头手势，本机 MediaPipe 推理，不上传摄像头图像。
- CleanYourTV 维护工作流、候选组件清单、原状态记录与恢复、模块卡片及 19 个按需插件入口。
- 配套官网：实时星系演示、真实界面画廊、操作说明与上游致谢。

## 下载与安装

`AstraTV-0.4.0-native-debug.apk` 为调试签名预览包，Android 8.0+、OpenGL ES 3.0，包含 armeabi-v7a / arm64-v8a。校验值见随附 `SHA256SUMS.txt`。请先保留原桌面并生成设备专属备份，按 [Android 指南](https://github.com/TheInitialDream1/astra-tv/blob/main/android/README.md) 安装。

## 当前边界

19 项核心维护运行时检查通过；实际原生停用与恢复闭环仍待实机联调。默认安装不执行清理、不更换原默认桌面。摄像头适配与手势准确性仍在完善；未实现语音对话，不宣称原生 4K 或所有机型稳定 60 FPS。19 个插件已构建，但未逐一完成实机运行验证。

详细验证范围见 [STATUS.md](https://github.com/TheInitialDream1/astra-tv/blob/main/guides/STATUS.md)。

特别感谢 [CleanYourTV](https://github.com/Gathin23/cleanyourtv) 的作者与贡献者。完整复用与许可说明见 [THIRD_PARTY_NOTICES.md](https://github.com/TheInitialDream1/astra-tv/blob/main/THIRD_PARTY_NOTICES.md)。
