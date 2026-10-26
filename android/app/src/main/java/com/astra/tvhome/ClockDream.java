package com.astra.tvhome;
import android.service.dreams.DreamService;
public final class ClockDream extends DreamService {public void onAttachedToWindow(){super.onAttachedToWindow();setInteractive(false);setFullscreen(true);setScreenBright(false);setContentView(new ClockFace(this));}}
