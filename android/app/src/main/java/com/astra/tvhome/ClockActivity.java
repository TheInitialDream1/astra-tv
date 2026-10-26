package com.astra.tvhome;
import android.app.Activity;import android.os.Bundle;import android.view.*;
public final class ClockActivity extends Activity {
    public void onCreate(Bundle b){super.onCreate(b);getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);ClockFace clock=new ClockFace(this);clock.setOnTouchListener((v,e)->{if(e.getAction()==MotionEvent.ACTION_DOWN)finish();return true;});setContentView(clock);}
    public boolean dispatchKeyEvent(KeyEvent e){int key=e.getKeyCode();if(key==KeyEvent.KEYCODE_VOLUME_UP||key==KeyEvent.KEYCODE_VOLUME_DOWN||key==KeyEvent.KEYCODE_VOLUME_MUTE)return super.dispatchKeyEvent(e);if(e.getAction()==KeyEvent.ACTION_DOWN)finish();return true;}
}
