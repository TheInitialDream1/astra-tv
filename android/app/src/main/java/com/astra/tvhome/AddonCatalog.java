package com.astra.tvhome;
import android.content.Context;import java.util.*;
/** Pinned upstream catalogue. Entries do not imply that an APK is installed or tested on this TV. */
final class AddonCatalog {
    static final class Addon {final String id,name,pkg,description,permissions;Addon(String i,String n,String p,String d,String r){id=i;name=n;pkg=p;description=d;permissions=r;}String url(){return "https://github.com/Gathin23/cleanyourtv/tree/0c0f69c3f1a50582bedc5569d4536367611ae9ff/addons/"+id;}}
    static List<Addon> all(){return Arrays.asList(
        new Addon("frigate-glance","家庭摄像头","io.github.nickld.frigateglance","Frigate 实时画面与提醒","网络、悬浮窗、辅助功能和前台服务"),
        new Addon("capacity-stats","容量与内存","com.lionlev.tv.capacity","内存与存储用量","无额外权限"),
        new Addon("weather","天气详情","io.github.sumyabazar1.weather","城市天气、空气质量与三日预报","网络"),
        new Addon("photo-prints","照片印记","io.github.shivamsingh262.photoprints","照片卡片与日期屏保","由文件选择器授权照片"),
        new Addon("photo-screensaver","照片与视频屏保","com.gathin.photodream","本地照片、视频和缓慢转场","选择文件；可选天气使用网络与粗略位置"),
        new Addon("prayer-times","祈祷时间","com.majnioui.tv.prayer","城市祈祷时间与倒计时","网络"),
        new Addon("tv-hub","直播中心","io.github.maxhayim.tvhub","M3U、XMLTV、HDHomeRun 节目指南","网络；需配置自己的节目来源"),
        new Addon("headphones","蓝牙耳机","io.github.maxhayim.headphones","配对设备、输出状态与断连保护","蓝牙配对设备访问"),
        new Addon("tv-static","开屏雪花","io.github.luyzfernando08.tvstatic","开屏雪花、彩条和无信号效果","悬浮窗、前台服务与开机启动"),
        new Addon("brightness","夜间亮度","io.github.maxhayim.brightness","额外调暗与暖色夜间模式","悬浮窗、前台服务与开机启动"),
        new Addon("sleep-timer","睡眠定时","io.github.luyzfernando08.sleeptimer","定时待机与延时提醒","辅助功能、悬浮窗和精确闹钟"),
        new Addon("quiet-hours","安静时段","io.github.maxhayim.quiethours","夜间音量上限","前台服务与开机启动"),
        new Addon("remote-access","远程访问状态","io.github.maxhayim.remoteaccess","网络 ADB、端口与 Tailscale 状态","网络状态；关闭调试按钮需要额外 ADB 授权"),
        new Addon("airplay-status","AirPlay 状态","io.github.maxhayim.airplaystatus","查看接收端名称与镜像能力","局域网 mDNS 与网络状态"),
        new Addon("sources","设备信号源","io.github.maxhayim.sources","HDMI-CEC 设备名与接入状态","无额外权限；受厂商接口限制"),
        new Addon("smart-home","智能家居","io.github.maxhayim.smarthome","Home Assistant 场景、灯光与温控","网络；需配置自己的 Home Assistant"),
        new Addon("ad-blocking","广告过滤状态","io.github.maxhayim.adblocking","Pi-hole / AdGuard Home 状态面板","网络；需配置自己的过滤服务器"),
        new Addon("world-clock","世界时钟","io.github.savioronezero.worldclock","多个时区的时间","无额外权限"),
        new Addon("flock","群星游动","io.github.cleanyourtv.flock","遥控器交互的群聚模拟","无额外权限")
    );}
    static boolean installed(Context c,String pkg){try{c.getPackageManager().getPackageInfo(pkg,0);return true;}catch(Exception e){return false;}}
}
