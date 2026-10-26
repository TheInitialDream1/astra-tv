# MediaPipe Lite 手部模型

源文件来自 Google MediaPipe 官方模型目录，URL 和 SHA256 见 SOURCES.json。参考官方说明：
https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/models.md
https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md

scripts/build-fast-hand-model.py 将两份原始 Lite 网络与现有 Hand Landmarker Tasks 包的输入归一化、输出标签等元数据打包，网络、张量、权重和算子均保持原样；脚本会逐个验证原始权重缓冲区未变化。结果为 public/mediapipe/hand_landmarker_fast.task。开发脚本使用 flatbuffers 和 tflite Python 包，普通 APK 构建不依赖它们。原始完整 Tasks 包仍用于精细模式。

测试图片 right_hands.jpg 和 thumb_up.jpg 来自同一 Google MediaPipe 官方资源服务器，并用于官方 HandLandmarker 测试。图片只随 Android 测试包安装，不进入桌面 APK。实际家庭环境仍需用户试用，参考图片不能替代不同距离和光线的测试。
