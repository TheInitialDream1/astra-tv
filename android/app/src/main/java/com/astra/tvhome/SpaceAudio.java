package com.astra.tvhome;
import android.media.*;
import android.os.SystemClock;
/** Short original synthesized sounds. Never changes the television's media volume. */
final class SpaceAudio {
    final MainActivity a;final SoundPool pool;int enter,switching;boolean loadedEnter,loadedSwitch,quiet;long last;
    SpaceAudio(MainActivity a){this.a=a;pool=new SoundPool.Builder().setMaxStreams(2).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build();pool.setOnLoadCompleteListener((p,id,status)->{if(status==0){if(id==enter)loadedEnter=true;if(id==switching)loadedSwitch=true;}});try{enter=pool.load(a.getAssets().openFd("audio/warp-enter.wav"),1);switching=pool.load(a.getAssets().openFd("audio/warp-switch.wav"),1);}catch(Exception ignored){}}
    void play(boolean entering){if(quiet||!a.pref().getBoolean("spaceSound",true))return;long now=SystemClock.uptimeMillis();if(now-last<120)return;int id=entering?enter:switching;if(!(entering?loadedEnter:loadedSwitch))return;last=now;float volume=new float[]{.16f,.30f,.48f}[a.pref().getInt("spaceSoundLevel",1)];pool.play(id,volume,volume,1,0,1);}
    void close(){pool.release();}
}
