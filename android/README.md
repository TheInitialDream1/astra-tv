# ASTRA Android TV · 原生版

Java / Android 原生控件、OpenGL ES 3、Camera2 / Camera1 NV21 兼容取帧和 MediaPipe 原生推理。没有 WebView，不依赖电脑服务。天气访问 Open-Meteo；维护只连接电视自己的本机 ADB；手势图像不上传。

## 安装与恢复

需要 Android 8.0 / API 26+、OpenGL ES 3.0。发布包包含 armeabi-v7a 与 arm64-v8a。先开启电视的网络 ADB 并允许你的电脑，在本地生成设备专属备份：

```sh
# 使用你自己的电视地址
python3 scripts/tv-device.py connect YOUR_TV_IP:5555
python3 scripts/tv-device.py --serial YOUR_TV_IP:5555 backup --out output/my-tv-before-install.json
```

`backup` 会读取并保存设备状态；保存的设备身份、原 HOME、包清单和启停状态只留在本地。不要把它们上传到公开 issue。

安装已下载的预览包：

```sh
adb -s YOUR_TV_IP:5555 install --no-streaming -r AstraTV-0.4.0-native-debug.apk
adb -s YOUR_TV_IP:5555 shell am start -n com.astra.tvhome/.MainActivity
```

包名 `com.astra.tvhome`。默认安装不更换原默认 HOME，不停用广告组件，也不修改全局分辨率。预编译包使用调试签名；自行构建的调试证书可能不同，不能直接覆盖另一证书安装的应用。

只检查相对于你自己的安装前备份的变化：

```sh
python3 scripts/restore-tv-install.py --backup output/my-tv-before-install.json
```

加 `--restore` 才撤回 ASTRA 安装。该脚本核对物理设备、固件和原桌面，移除本次新增的 ASTRA，核验包状态。它不刷机、不恢复出厂，也不备份第三方应用的账号数据。后续执行的维护改动，应先从应用恢复中心按记录撤回，不能用卸载 ASTRA 代替。

## 构建

需要 Node.js 22.12+、JDK 17+、Android SDK Platform 35 / Build Tools 35.0.0：

```sh
npm ci
npm run prepare:assets
npm run build:android
```

若 SDK 不在默认位置，设置 `ANDROID_SDK_ROOT`。输出为 `output/android/AstraTV-0.4.0-native-debug.apk`。完整手部模型由准备脚本从 Google 下载；快速模型及来源在仓库中，重新打包参考 `scripts/build-fast-hand-model.py` 和 `third_party/mediapipe-lite/`。

## 遥控与手势

- 顶部「宇宙」确认进入第一个可见应用，方向键按保存的顺序遍历。确认打开，菜单或长按确认查看管理。
- 返回拉远；远景再按返回保持桌面。菜单打开设置。系统 Home 由当前默认桌面处理。
- 顶部 ↓ 到底部快捷栏，底部 ↑ 回顶部。应用库支持 4—7 列、分类、排序、快捷栏和仅从星云隐藏。
- 手势需手动开启并允许摄像头。掌心移动、捏合打开；双掌展开进入，拉合缩放。有预览、骨架和识别状态。切换应用会释放摄像头，回桌面需重新开启。
- Camera2 无兼容输出时尝试 Camera1 NV21。模型在本机运行；实际准确性和延迟取决于设备、距离和光线。

## 设置与系统维护

星系动态、色彩流动、亮度、密度、声音、天气城市、快捷栏、遥控彩色键和漂移时钟均可配置。应用设置采用原生界面，只有厂商特有权限、屏保或高级设置需要调用系统页面。

系统维护会生成独立 ADB 密钥。Android 必须允许这把密钥，电脑已有授权不能代替。连接地址固定为电视自己的 127.0.0.1:5555，不拷贝电脑私钥。

清理只停用，不清除数据；具体清单先预览。每次改动前保存原状态和恢复记录。原桌面、核心系统与硬件相关组件受保护。恢复要求备份对应同一物理设备与固件。功能详情和限制见 [CleanYourTV 集成说明](../third_party/cleanyourtv/INTEGRATION.md)。

部分电视没有 Android 文件选择器，可在本机 ADB 已授权后，使用应用内下载目录浏览器导入配置或选择插件 APK。插件源码构建：

```sh
python3 scripts/build-cleanyourtv-addon.py capacity-stats
# 明确要求构建全部插件时：
python3 scripts/build-cleanyourtv-addon.py all
```

独立插件需要分别安装、批准卡片和配置外部服务，不会自动开启悬浮窗、辅助功能或家庭服务权限。

## 渲染与验证范围

原生星系采用连续星盘、暗尘带、差速旋转、平流噪声与三维恒星点。近处按距离选择有限数量的应用星系，其他应用保持星点。图标单独在窗口分辨率绘制，使用圆角抗锯齿、mipmap 和可用的各向异性过滤。

现有测试机提供 1920 × 1080 应用窗口。环境缓冲上限 1536 × 864，摄像头开启时降低至 1024 × 576。当前不宣称原生 4K 输出；强制 4K 的尝试未达到流畅要求。

本版本 19 项核心维护运行时检查通过，但实际停用与恢复闭环、完整界面复测和更多机型仍待验证。请查看 [STATUS.md](../guides/STATUS.md)，不要将历史版本的结果当成本版本全部场景的保证。
