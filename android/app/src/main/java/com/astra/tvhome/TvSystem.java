package com.astra.tvhome;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.media.tv.*;
import android.net.Uri;
import android.provider.Settings;
import java.util.*;

final class TvSystem {
    static final Set<String> ADS=new HashSet<>(Arrays.asList("com.miui.analytics","com.miui.tv.analytics","com.mitv.advertise","com.mitv.shoplugin","com.duokan.videodaily","com.xm.webcontent","com.xiaomi.mitv.shop","com.miui.misightservice","com.xiaomi.tvqs"));
    static Intent settings(Context c,String page){String a=page.equals("network")?Settings.ACTION_WIFI_SETTINGS:page.equals("home")?Settings.ACTION_HOME_SETTINGS:page.equals("inputs")?"android.settings.TV_INPUT_SETTINGS":page.equals("cast")?Settings.ACTION_CAST_SETTINGS:page.equals("apps")?Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS:Settings.ACTION_SETTINGS;return SystemSettings.intent(c,a);}
    static List<String> cleanupScan(Context c){List<String> found=new ArrayList<>();for(ApplicationInfo a:c.getPackageManager().getInstalledApplications(0))if(ADS.contains(a.packageName))found.add(c.getPackageManager().getApplicationLabel(a)+" · "+a.packageName+(a.enabled?" · 已启用":" · 已停用"));return found;}
    static List<TvInputInfo> inputs(Context c){List<TvInputInfo> list=new ArrayList<>();try{TvInputManager m=(TvInputManager)c.getSystemService(Context.TV_INPUT_SERVICE);if(m!=null)for(TvInputInfo i:m.getTvInputList())if(i.isPassthroughInput()&&!i.isHidden(c))list.add(i);}catch(Exception ignored){}return list;}
    static Intent input(TvInputInfo i){return new Intent(Intent.ACTION_VIEW,TvContract.buildChannelUriForPassthroughInput(i.getId()));}
}
