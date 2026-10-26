package com.astra.tvhome;
import android.accessibilityservice.AccessibilityService;import android.view.KeyEvent;import android.view.accessibility.AccessibilityEvent;
/** Optional system-approved key filtering, without screen-content access. */
public final class RemoteKeyService extends AccessibilityService {final RemoteBindings bindings=new RemoteBindings();protected boolean onKeyEvent(KeyEvent event){return bindings.dispatch(this,event);}public void onAccessibilityEvent(AccessibilityEvent event){}public void onInterrupt(){}}
