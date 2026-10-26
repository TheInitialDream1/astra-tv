package com.astra.tvhome;

import android.content.Context;
import android.graphics.*;
import android.view.View;
import java.util.*;

final class NebulaHud extends View {
    final NebulaView scene;final List<NativeApp> apps;final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);boolean camera,showPreview=true,closing;float displayedX=-1,displayedY;long pointerTime,lastStats;String cachedStats="";String cameraStatus="",dockLabel="";float pointerX=-1,pointerY=-1;int hovered=-1;final ArrayDeque<float[]> trail=new ArrayDeque<>();
    NebulaHud(Context c,NebulaView scene,List<NativeApp> apps){super(c);this.scene=scene;this.apps=apps;setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);setFocusable(false);}
    void text(Canvas c,String value,float x,float y,float size,int color){paint.setColor(color);paint.setTextSize(size);paint.setTypeface(Typeface.create("sans-serif-light",Typeface.NORMAL));paint.setStyle(Paint.Style.FILL);c.drawText(value,x,y,paint);}
    @Override protected void onDraw(Canvas c){float w=getWidth(),h=getHeight(),s=w/1280f;int muted=0xff99b7c6,white=0xffe2f2fa;int selected=scene.renderer.selected;
        Paint shade=new Paint();shade.setShader(new LinearGradient(0,0,0,h,new int[]{0xa801050d,0x0001050d,0x0001050d,0x7801050d},new float[]{0,.19f,.76f,1},Shader.TileMode.CLAMP));c.drawRect(0,0,w,h,shade);
        for(NebulaView.ScreenApp a:scene.renderer.screens)if((a.reveal>.78||a.index==hovered)&&a.y>.14&&a.y<.79&&(a.index==selected||a.index==hovered)){
            float x=a.x*w,y=a.y*h,offset=Math.min(h*.2f,h*.82f/a.distance);String name=apps.get(a.index).name+(apps.get(a.index).caption.isEmpty()?"":" · "+apps.get(a.index).caption);paint.setTextSize(20*s);float tw=paint.measureText(name);text(c,name,x-tw/2,y+offset+30*s,20*s,white);
            if(a.index==selected){String count=String.format(Locale.ROOT,"%02d  /  %02d",selected+1,apps.size());paint.setTextSize(12*s);text(c,count,(w-paint.measureText(count))*.5f,h*.92f,12*s,muted);}
        }
        if(!dockLabel.isEmpty()){paint.setTextSize(16*s);text(c,dockLabel,(w-paint.measureText(dockLabel))*.5f,h*.965f,16*s,muted);}
        MainActivity activity=(MainActivity)getContext();if(activity.pref().getBoolean("showDate",false))text(c,new java.text.SimpleDateFormat("M月d日 EEEE",java.util.Locale.CHINA).format(new java.util.Date()),48*s,83*s,14*s,muted);if(activity.pref().getBoolean("showStats",false)){long now=android.os.SystemClock.uptimeMillis();if(now-lastStats>5000){android.app.ActivityManager.MemoryInfo memory=new android.app.ActivityManager.MemoryInfo();((android.app.ActivityManager)activity.getSystemService(android.content.Context.ACTIVITY_SERVICE)).getMemoryInfo(memory);android.os.StatFs storage=new android.os.StatFs(activity.getFilesDir().getPath());cachedStats="可用内存 "+memory.availMem/1048576+" MB · 可用存储 "+storage.getAvailableBytes()/1073741824L+" GB";lastStats=now;}text(c,Math.round(scene.renderer.fps)+" FPS · "+cachedStats,48*s,h*.965f,12*s,muted);}
        if(camera&&!cameraStatus.isEmpty()){String status=cameraStatus;if(status.length()>35)status=status.substring(0,35)+"…";paint.setTextSize(12*s);text(c,status,w*.95f-paint.measureText(status),h*.145f,12*s,muted);}
        if(pointerX>=0){long now=android.os.SystemClock.uptimeMillis();float k=1-(float)Math.exp(-Math.min(80,now-pointerTime)/38f);if(displayedX<0){displayedX=pointerX;displayedY=pointerY;}else{displayedX+=(pointerX-displayedX)*k;displayedY+=(pointerY-displayedY)*k;}pointerTime=now;float x=displayedX*w,y=displayedY*h;trail.addLast(new float[]{x,y});while(trail.size()>18)trail.removeFirst();int i=0;for(float[] p:trail){paint.setColor(Color.argb(8+i*5,130,227,255));c.drawCircle(p[0],p[1],(1+i*.1f)*s,paint);i++;}paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(.9f*s);paint.setColor(hovered>=0?0xffb9fff2:0xff87dfff);c.drawCircle(x,y,(closing?9:12)*s,paint);if(hovered>=0){paint.setStrokeWidth(2*s);c.drawArc(x-18*s,y-18*s,x+18*s,y+18*s,-90,closing?360:235,false,paint);}paint.setStyle(Paint.Style.FILL);c.drawCircle(x,y,3f*s,paint);if(Math.abs(displayedX-pointerX)+Math.abs(displayedY-pointerY)>.0008)postInvalidateOnAnimation();}else {trail.clear();displayedX=-1;}
        if(!scene.renderer.failure.isEmpty())text(c,"图形引擎异常："+scene.renderer.failure,w*.2f,h*.5f,13*s,white);
    }
}
